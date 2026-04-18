from rest_framework.filters import OrderingFilter
import logging
import sys

logger = logging.getLogger(__name__)

class SafeOrderingFilter(OrderingFilter):
    """
    Um filtro de ordenação personalizado que ignora silenciosamente os campos de ordenação
    inválidos em vez de lançar um erro.

    Isso é útil quando a interface do usuário (frontend) pode enviar parâmetros de
    ordenação antigos ou incorretos que não existem mais no modelo do banco de dados.
    """

    def filter_queryset(self, request, queryset, view):
        # Usa o método da classe pai para obter os parâmetros de ordenação da URL
        ordering = self.get_ordering(request, queryset, view)

        # DEBUG: log agressivo para confirmar que este filtro está sendo executado
        try:
            msg = f"\n\n===== [SafeOrderingFilter] INVOKED ===== view={view.__class__.__name__} ordering={ordering}\n\n"
            print(msg, file=sys.stderr, flush=True)
            logger.warning(msg)
        except Exception as e:
            print(f"ERROR IN DEBUG: {e}", file=sys.stderr, flush=True)

        if ordering:
            # Se houver parâmetros de ordenação, vamos validá-los.

            # 1. Obter uma lista de todos os nomes de campos válidos do modelo.
            valid_fields = {f.name for f in queryset.model._meta.get_fields()}

            # 2. Filtrar a lista de ordenação para manter apenas os campos válidos.
            #    Isso lida com ordenação ascendente (ex: 'campo') e
            #    descendente (ex: '-campo'), verificando o nome do campo sem o '-'.

            safe_ordering = [term for term in ordering if term.lstrip('-') in valid_fields]

            # 3. Se, após a filtragem, ainda houver campos de ordenação válidos,
            #    aplica-os ao queryset.
            if safe_ordering:
                return queryset.order_by(*safe_ordering)

        # Se não houver parâmetros de ordenação na requisição, ou se nenhum deles
        # for válido, simplesmente retorna o queryset original sem ordenação.
        return queryset
