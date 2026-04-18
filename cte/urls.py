from django.urls import path
from .views import CTeListView, CTeCreateView, CTeUpdateView

urlpatterns = [
    path('', CTeListView.as_view(), name='cte_list'),
    path('novo/', CTeCreateView.as_view(), name='cte_create'),
    path('<int:pk>/editar/', CTeUpdateView.as_view(), name='cte_update'),
]
