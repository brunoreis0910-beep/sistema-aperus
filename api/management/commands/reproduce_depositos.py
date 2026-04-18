from django.core.management.base import BaseCommand
from django.test import RequestFactory
from rest_framework.test import force_authenticate
from django.contrib.auth import get_user_model
import traceback

from api.views import DepositoViewSet


class Command(BaseCommand):
    help = "Reproduce a GET /api/depositos/ call and print full traceback if it raises"

    def handle(self, *args, **options):
        User = get_user_model()
        user = None
        # prefer an existing admin/staff user, else create a minimal one
        try:
            user = User.objects.filter(is_active=True).first()
        except Exception:
            self.stdout.write("Could not query users; proceeding without a user")

        if not user:
            # create a lightweight temporary user
            try:
                user = User.objects.create_user(username='apitest', password='apipass')
                self.stdout.write("Created temporary user 'apitest' (password: apipass)")
            except Exception as e:
                self.stdout.write(f"Failed to create temporary user: {e}")

        rf = RequestFactory()
        request = rf.get('/api/depositos/')

        # If we have a user, force-authenticate the request to simulate authenticated client
        if user:
            try:
                force_authenticate(request, user=user)
            except Exception as e:
                self.stdout.write(f"force_authenticate failed: {e}")

        view = DepositoViewSet.as_view({'get': 'list'})

        try:
            response = view(request)
            # DRF Response objects may not be fully serialized here; try to display key info
            status = getattr(response, 'status_code', None)
            data = getattr(response, 'data', None)
            if data is None:
                content = getattr(response, 'content', None)
            else:
                content = data
            self.stdout.write(f"Response status: {status}")
            self.stdout.write(f"Response content: {content}")
        except Exception:
            self.stdout.write("Exception raised while calling DepositoViewSet.list():")
            traceback.print_exc()
