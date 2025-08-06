from django.urls import path
from .views import CustomAuthToken, ItemList
from django.contrib import admin  # Importação adicionada

urlpatterns = [
    path("items/", ItemList.as_view(), name="item-list"),
    path('login/', CustomAuthToken.as_view(), name='api-login'),
]
