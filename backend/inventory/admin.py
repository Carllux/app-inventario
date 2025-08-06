from django.contrib import admin
from .models import Item  # Importa o modelo Item do mesmo diretório

# Register your models here.

# A linha abaixo registra o modelo Item no painel de administração
admin.site.register(Item)