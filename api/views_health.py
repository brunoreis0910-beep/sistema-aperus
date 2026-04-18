"""
Health Check — /api/health/

Endpoint público (sem JWT) para monitoramento de infraestrutura.
Retorna o status de cada componente e um código HTTP:
  200 OK       — todos os componentes healthy
  207 Multi    — pelo menos um componente degraded (funcional, porém lento)
  503 Degraded — componente crítico (banco de dados) indisponível
"""
import time
import platform
import django
from datetime import datetime, timezone as dt_tz

from django.conf import settings
from django.db import connection, OperationalError as DBOperationalError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


def _check_database() -> dict:
    """Testa a conexão com o banco de dados MySQL."""
    start = time.monotonic()
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
        ms = round((time.monotonic() - start) * 1000, 1)
        status = "healthy" if ms < 200 else "degraded"
        return {"status": status, "latency_ms": ms, "engine": settings.DATABASES["default"]["ENGINE"]}
    except DBOperationalError as exc:
        return {"status": "error", "error": str(exc)}
    except Exception as exc:
        return {"status": "error", "error": str(exc)}


def _check_migrations() -> dict:
    """Conta migrations aplicadas vs. pendentes."""
    try:
        from django.db.migrations.executor import MigrationExecutor
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        pending = len(plan)
        applied = sum(1 for _ in executor.loader.applied_migrations)
        return {"status": "healthy" if pending == 0 else "degraded",
                "applied": applied, "pending": pending}
    except Exception as exc:
        return {"status": "unknown", "error": str(exc)}


def _check_gemini() -> dict:
    """Verifica se a chave do Gemini está configurada."""
    try:
        from decouple import config
        key = config("GEMINI_API_KEY", default="")
        if not key:
            return {"status": "unconfigured", "note": "GEMINI_API_KEY não definida no .env"}
        # Apenas valida presença da chave — não faz chamada de rede para não atrasar
        return {"status": "configured", "note": "Chave presente (ping não realizado)"}
    except Exception as exc:
        return {"status": "error", "error": str(exc)}


def _check_evolution_api() -> dict:
    """Verifica conectividade com Evolution API (WhatsApp)."""
    try:
        from decouple import config
        import requests as req

        base_url = config("EVOLUTION_API_URL", default="").strip().rstrip("/")
        api_key = config("EVOLUTION_API_KEY", default="").strip()
        instance = config("EVOLUTION_INSTANCE", default="default")

        if not base_url or not api_key:
            return {"status": "unconfigured", "note": "EVOLUTION_API_URL ou EVOLUTION_API_KEY não definidas"}

        start = time.monotonic()
        r = req.get(
            f"{base_url}/instance/connectionState/{instance}",
            headers={"apikey": api_key},
            timeout=5,
        )
        ms = round((time.monotonic() - start) * 1000, 1)
        state = r.json().get("instance", {}).get("state", "unknown") if r.ok else "unreachable"
        return {
            "status": "healthy" if state == "open" else "degraded",
            "state": state,
            "latency_ms": ms,
        }
    except Exception as exc:
        return {"status": "unconfigured", "note": str(exc)}


def _check_whatsapp_cloud() -> dict:
    """Verifica se o WhatsApp Cloud API está configurado."""
    try:
        from decouple import config
        token = config("WHATSAPP_CLOUD_TOKEN", default="").strip()
        phone_id = config("WHATSAPP_PHONE_NUMBER_ID", default="").strip()
        if not token or not phone_id:
            return {"status": "unconfigured", "note": "WHATSAPP_CLOUD_TOKEN ou WHATSAPP_PHONE_NUMBER_ID não definidas"}
        return {"status": "configured", "phone_number_id": phone_id[-4:] + "****"}
    except Exception as exc:
        return {"status": "error", "error": str(exc)}


class HealthCheckView(APIView):
    """
    GET /api/health/
    Endpoint público — não requer autenticação.
    Usado por monitoramento externo (uptime robots, Zabbix, etc.)
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        db = _check_database()
        migrations = _check_migrations()
        gemini = _check_gemini()
        evolution = _check_evolution_api()
        whatsapp_cloud = _check_whatsapp_cloud()

        components = {
            "database": db,
            "migrations": migrations,
            "gemini_ai": gemini,
            "evolution_api": evolution,
            "whatsapp_cloud": whatsapp_cloud,
        }

        statuses = [c["status"] for c in components.values()]

        if "error" in statuses and components["database"]["status"] == "error":
            overall = "critical"
            http_code = 503
        elif "error" in statuses or "degraded" in statuses:
            overall = "degraded"
            http_code = 207
        else:
            overall = "healthy"
            http_code = 200

        payload = {
            "status": overall,
            "timestamp": datetime.now(dt_tz.utc).isoformat(),
            "system": {
                "django_version": django.__version__,
                "python_version": platform.python_version(),
                "environment": "production" if not settings.DEBUG else "development",
            },
            "components": components,
        }
        return Response(payload, status=http_code)


class HealthCheckDetailView(APIView):
    """
    GET /api/health/detail/
    Requer autenticação JWT — retorna informações detalhadas incluindo
    contagem de registros nos modelos principais.
    """

    def get(self, request):
        from django.apps import apps

        stats = {}
        models_to_count = [
            ("api", "Cliente"),
            ("api", "Produto"),
            ("api", "Venda"),
            ("api", "FinanceiroConta"),
            ("api", "Funcionario"),
        ]
        for app_label, model_name in models_to_count:
            try:
                model = apps.get_model(app_label, model_name)
                stats[model_name] = model.objects.count()
            except Exception:
                stats[model_name] = "N/A"

        db = _check_database()
        migrations = _check_migrations()

        return Response({
            "status": "healthy" if db["status"] == "healthy" else "degraded",
            "timestamp": datetime.now(dt_tz.utc).isoformat(),
            "database": db,
            "migrations": migrations,
            "record_counts": stats,
        })
