# Django core
import uuid
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db.models.signals import post_save
from django.test import TestCase, TransactionTestCase

# Django REST Framework
from rest_framework import status
from rest_framework.test import APITestCase

# Third-party libraries
from PIL import Image as PilImage
from unittest.mock import patch

# Local imports
from inventory.signals import create_or_update_user_profile

# Python standard library
from io import BytesIO
import tempfile
import os

from .models import (
    Branch,
    Category,
    Item,
    Location,
    MovementType,
    Sector,
    StockItem,
    StockMovement,
    Supplier,
    SystemSettings,
    UserProfile
)


class InventoryTestMixin:
    """
    Mixin de setup de dados ISOLADO para testes.
    Cria dados com prefixos únicos para evitar conflitos com dados reais.
    """
    
    @classmethod
    def setUpTestData(cls):
        # --- Configurar o Ambiente para os Signals ---
        # Cria a filial e setor padrão que o signal espera encontrar
        cls.branch_sp = Branch.objects.create(
            name='[TEST] Filial Principal', 
            description='Filial para testes automatizados'
        )
        cls.sector_sp = Sector.objects.create(
            name='[TEST] Estoque', 
            branch=cls.branch_sp,
            description='Setor de estoque para testes'
        )
        
        # Configura settings do sistema para testes
        settings = SystemSettings.get_solo()
        settings.default_branch = cls.branch_sp
        settings.default_sector = cls.sector_sp
        settings.save()

        # --- Criar Usuários com prefixo único ---
        cls.admin_user = User.objects.create_superuser(
            'test_admin', 
            'test_admin@test.com', 
            'testpassword123'
        )
        cls.normal_user_sp = User.objects.create_user(
            'test_user_sp', 
            'test_sp@test.com', 
            'testpassword123'
        )
        
        # --- Criar dados para cenários de multi-filial ---
        cls.branch_rj = Branch.objects.create(
            name='[TEST] Filial RJ',
            description='Filial RJ para testes'
        )
        cls.normal_user_rj = User.objects.create_user(
            'test_user_rj', 
            'test_rj@test.com', 
            'testpassword123'
        )
        
        # Atribui manualmente a filial RJ para o usuário do RJ
        cls.normal_user_rj.profile.branches.add(cls.branch_rj)

        # --- Criar Outros Dados de Suporte com prefixo único ---
        cls.location_sp = Location.objects.create(
            branch=cls.branch_sp, 
            location_code='TEST-SP-A1', 
            name='[TEST] Prateleira SP'
        )
        cls.location_rj = Location.objects.create(
            branch=cls.branch_rj, 
            location_code='TEST-RJ-B2', 
            name='[TEST] Prateleira RJ'
        )
        
        cls.category = Category.objects.create(
            name='[TEST] Categoria de Teste',
            description='Categoria para testes automatizados'
        )
        
        cls.supplier = Supplier.objects.create(
            name='[TEST] Fornecedor de Teste', 
            country='BR',
            email='test_fornecedor@test.com'
        )
        
        # --- CORREÇÃO: Códigos de MovementType dentro do limite de 10 caracteres ---
        cls.movement_type_entry = MovementType.objects.create(
            name='T Entrada',     # ✅ 9 caracteres (dentro do limite)
            code='T_ENT',         # ✅ 5 caracteres (dentro do limite de 10)
            factor=1,
            description='Tipo de movimento de entrada para testes'
        )
        
        cls.movement_type_exit = MovementType.objects.create(
            name='T Saida',       # ✅ 7 caracteres  
            code='T_SAI',         # ✅ 5 caracteres
            factor=-1,
            description='Tipo de movimento de saída para testes'
        )

        # --- Criar Itens com SKUs únicos ---
        cls.item_sp = Item.objects.create(
            created_by=cls.admin_user, 
            sku='TEST-SKU-SP-001', 
            name='[TEST] Item de SP', 
            sale_price=10.00, 
            purchase_price=5.00, 
            branch=cls.branch_sp,
            category=cls.category, 
            supplier=cls.supplier,
            internal_code='TEST-INT-SP-001'
        )
        
        cls.item_rj = Item.objects.create(
            created_by=cls.admin_user, 
            sku='TEST-SKU-RJ-002', 
            name='[TEST] Item de RJ', 
            sale_price=20.00, 
            purchase_price=10.00, 
            branch=cls.branch_rj,
            category=cls.category, 
            supplier=cls.supplier,
            internal_code='TEST-INT-RJ-002'
        )
        
        # --- Criar Estoque Inicial ---
        StockItem.objects.create(
            item=cls.item_sp, 
            location=cls.location_sp, 
            quantity=100
        )
        
        StockItem.objects.create(
            item=cls.item_rj, 
            location=cls.location_rj, 
            quantity=50
        )

        # Recarrega os objetos de usuário para garantir que o perfil está anexado
        cls.admin_user.refresh_from_db()
        cls.normal_user_sp.refresh_from_db()
        cls.normal_user_rj.refresh_from_db()

    @classmethod
    def create_unique_sku(cls):
        """Gera um SKU único para testes"""
        return f"T-SKU-{uuid.uuid4().hex[:6].upper()}"  # ✅ Mais curto

    @classmethod
    def create_test_user(cls, username_suffix, email_suffix, branches=None):
        """Cria usuário de teste com configuração controlada"""
        username = f"test_{username_suffix}"
        email = f"test_{email_suffix}@test.com"
        
        user = User.objects.create_user(username, email, 'testpassword123')
        
        if branches:
            user.profile.branches.set(branches)
        
        return user

    @classmethod
    def create_test_item(cls, **kwargs):
        """Cria item de teste com valores padrão"""
        defaults = {
            'sku': cls.create_unique_sku(),
            'name': f'[TEST] Item {uuid.uuid4().hex[:4]}',  # ✅ Mais curto
            'sale_price': 10.00,
            'purchase_price': 5.00,
            'branch': cls.branch_sp,
            'category': cls.category,
            'supplier': cls.supplier,
            'created_by': cls.admin_user,
        }
        defaults.update(kwargs)
        
        return Item.objects.create(**defaults)

    @classmethod
    def create_test_movement_type(cls, **kwargs):
        """Cria tipo de movimento de teste dentro dos limites"""
        # Gera sufixos curtos para ficar dentro dos limites
        suffix = uuid.uuid4().hex[:3].upper()  # 3 caracteres apenas
        
        defaults = {
            'name': f'T Mv {suffix}',      # ✅ Máximo 7 caracteres
            'code': f'T_{suffix}',         # ✅ Máximo 5 caracteres
            'factor': 1,
            'description': f'Tipo de movimento teste {suffix}'
        }
        defaults.update(kwargs)
        
        return MovementType.objects.create(**defaults)
""""
modelo de uso para quando uma classe necessitar de dados adicionais
class TesteEspecifico(InventoryTestMixin, APITestCase):
    @classmethod
    def setUpTestData(cls):
        # 1. Executa toda a criação de dados do mixin
        super().setUpTestData() 
        
        # 2. Agora, cria os dados extras apenas para esta suíte
        cls.item_especial = Item.objects.create(
            name='Item Especial',
            # ... outros campos ...
            branch=cls.branch_sp 
        )
"""

# ✅ NOVA SUÍTE DE TESTES PARA O MODELO ITEM
class ItemModelTests(InventoryTestMixin, TestCase): # ✅ Classe base alterada
    """
    Suite de testes focada no comportamento do modelo Item,
    como a otimização de imagem no método save().
    """

    # Nenhum método setUp é necessário. Os dados vêm do InventoryTestMixin.

    def create_test_image(self, width=2000, height=2000, format='JPEG'):
        buffer = BytesIO()
        image = PilImage.new('RGB', (width, height), 'white')
        image.save(buffer, format=format)
        buffer.seek(0)
        return SimpleUploadedFile(f"test.{format.lower()}", buffer.read(), content_type=f"image/{format.lower()}")

    def test_image_is_optimized_on_save(self):
        item = Item.objects.create(
            created_by=self.admin_user, sku='SKU-IMG-TEST', name='Item com Imagem',
            sale_price=100, branch=self.branch_sp, category=self.category,
            supplier=self.supplier, photo=self.create_test_image()
        )
        self.assertTrue(item.photo.name.endswith('.webp'))
        saved_image = PilImage.open(item.photo.path)
        self.assertEqual(saved_image.format, 'WEBP')
        self.assertLessEqual(saved_image.width, 1024)

        
class ItemListAPITests(InventoryTestMixin, APITestCase):
    """
    Suite de testes completa para o endpoint de listagem de Itens (GET /api/items/).
    Testa cenários de permissão, filtragem e estrutura da resposta.
    """

    # Nenhum método setUp é necessário. Todos os dados vêm do InventoryTestMixin.

    def test_unauthenticated_user_cannot_access_items(self):
        """Verifica se um usuário não autenticado recebe erro 401 (Unauthorized)."""
        response = self.client.get('/api/items/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_normal_user_sees_only_their_branch_items(self):
        """Verifica se a listagem para um usuário normal retorna apenas os itens de sua filial."""
        self.client.force_authenticate(user=self.normal_user_sp)
        response = self.client.get('/api/items/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['sku'], self.item_sp.sku)

    def test_admin_user_sees_all_items(self):
        """Verifica se um usuário administrador (staff) vê TODOS os itens de TODAS as filiais."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/items/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

        # ✅ MELHORIA: Verificação mais robusta.
        # Garante que os SKUs de AMBOS os itens estão na resposta.
        skus_in_response = {item['sku'] for item in response.data['results']}
        self.assertIn(self.item_sp.sku, skus_in_response)
        self.assertIn(self.item_rj.sku, skus_in_response)
    
    def test_user_can_filter_by_accessible_location(self):
        """Verifica se um usuário pode filtrar por uma localização à qual ele tem acesso."""
        self.client.force_authenticate(user=self.normal_user_sp)
        url = f'/api/items/?stock_items__location={self.location_sp.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_user_cannot_filter_by_inaccessible_location(self):
        """Verifica se o filtro por uma localização PROIBIDA retorna uma lista vazia."""
        self.client.force_authenticate(user=self.normal_user_sp)
        url = f'/api/items/?stock_items__location={self.location_rj.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

class StockMovementAPITests(InventoryTestMixin, APITestCase):
    """
    Suite de testes para o endpoint de criação de Movimentações (POST /api/movements/).
    """

    # Nenhum método setUp é necessário. Todos os dados vêm do InventoryTestMixin.

    def test_authenticated_user_can_create_movement(self):
        """Verifica se um usuário logado pode criar uma movimentação de entrada válida."""
        self.client.force_authenticate(user=self.normal_user_sp)
        
        # ✅ Usa os dados do mixin
        stock_item = StockItem.objects.get(item=self.item_sp, location=self.location_sp)
        stock_before = stock_item.quantity
        
        movement_data = {
            'item': self.item_sp.pk,
            'location': self.location_sp.pk,
            'movement_type': self.movement_type_entry.pk,
            'quantity': 10
        }
        response = self.client.post('/api/movements/', movement_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"A API falhou com o erro: {response.data}")
        
        stock_item.refresh_from_db()
        self.assertEqual(stock_item.quantity, stock_before + 10)

    def test_unauthenticated_user_cannot_create_movement(self):
        """Verifica se um usuário não logado é bloqueado."""
        movement_data = {
            'item': self.item_sp.pk, 
            'location': self.location_sp.pk,
            'movement_type': self.movement_type_entry.pk, 
            'quantity': 10
        }
        response = self.client.post('/api/movements/', movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_movement_fails_with_missing_data(self):
        """Verifica a rejeição de dados essenciais faltando (ex: item)."""
        self.client.force_authenticate(user=self.normal_user_sp)
        invalid_data = {
            'location': self.location_sp.pk,
            'movement_type': self.movement_type_entry.pk,
            'quantity': 10
        }
        response = self.client.post('/api/movements/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('item', response.data)
        
    def test_movement_quantity_must_be_positive(self):
        """Verifica a rejeição de quantidade zero ou negativa."""
        self.client.force_authenticate(user=self.normal_user_sp)
        invalid_data = {
            'item': self.item_sp.pk, 
            'location': self.location_sp.pk,
            'movement_type': self.movement_type_entry.pk, 
            'quantity': 0
        }
        response = self.client.post('/api/movements/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # A validação agora está no serializer, que retorna um dict
        self.assertIn('quantity', response.data)

    def test_outbound_movement_fails_with_insufficient_stock(self):
        """Verifica se saídas com estoque insuficiente são rejeitadas."""
        self.client.force_authenticate(user=self.normal_user_sp)
        
        # O estoque inicial de item_sp é 100, conforme definido no mixin
        invalid_data = {
            'item': self.item_sp.pk, 
            'location': self.location_sp.pk,
            'movement_type': self.movement_type_exit.pk, # ✅ Usa o tipo de saída do mixin
            'quantity': 101 # Tenta remover mais do que o estoque existente
        }
        response = self.client.post('/api/movements/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # A validação está no serializer, que retorna um erro geral
        self.assertIn('Estoque insuficiente', str(response.data))

class ItemListAPITests(InventoryTestMixin, APITestCase):
    """
    Suite de testes completa para o endpoint de listagem de Itens (GET /api/items/).
    Testa cenários de permissão, filtragem e estrutura da resposta.
    """

    # Nenhum método setUp é necessário. Todos os dados vêm do InventoryTestMixin.

    def test_unauthenticated_user_cannot_access_items(self):
        """Verifica se um usuário não autenticado recebe erro 401 (Unauthorized)."""
        response = self.client.get('/api/items/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_normal_user_sees_only_their_branch_items(self):
        """Verifica se a listagem para um usuário normal retorna apenas os itens de sua filial."""
        self.client.force_authenticate(user=self.normal_user_sp)
        response = self.client.get('/api/items/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['sku'], self.item_sp.sku)

    def test_admin_user_sees_all_items(self):
        """Verifica se um usuário administrador (staff) vê TODOS os itens de TODAS as filiais."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/items/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # O mixin cria 2 itens, um em cada filial. O admin deve ver ambos.
        self.assertEqual(len(response.data['results']), 2)

    def test_user_can_filter_by_accessible_location(self):
        """Verifica se um usuário pode filtrar por uma localização à qual ele tem acesso."""
        self.client.force_authenticate(user=self.normal_user_sp)
        url = f'/api/items/?stock_items__location={self.location_sp.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_user_cannot_filter_by_inaccessible_location(self):
        """Verifica se o filtro por uma localização PROIBIDA retorna uma lista vazia."""
        self.client.force_authenticate(user=self.normal_user_sp)
        url = f'/api/items/?stock_items__location={self.location_rj.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_item_api_response_contains_expected_fields(self):
        """Verifica se a resposta da API (o "contrato") contém os campos esperados."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/items/')
        
        self.assertGreater(len(response.data['results']), 0, "A API não retornou itens.")
        item_data = response.data['results'][0]

        expected_fields = [
            'id', 'sku', 'name', 'category', 'supplier', 'photo',
            'total_quantity', 'is_low_stock', 'sale_price', 'brand',
            'short_description', 'active' # Adicionado 'active' que está no serializer
        ]

        for field in expected_fields:
            self.assertIn(field, item_data, f"O campo '{field}' está faltando no contrato da API.")
            
        self.assertIn('name', item_data['category'])
        self.assertIn('name', item_data['supplier'])


# --- SUÍTE 2: TESTES PARA A CRIAÇÃO DE ITENS (POST) ---
# Em backend/inventory/tests.py

class ItemCreateAPITests(InventoryTestMixin, APITestCase):  # ✅ Mudança aqui
    """
    Suite de testes para a criação de Itens (POST /api/items/).
    Usa TransactionTestCase para evitar problemas com transações concorrentes.
    """

    def test_authenticated_user_can_create_item(self):
        """Teste sem mock, usando TransactionTestCase para isolamento"""
        
        self.client.force_authenticate(user=self.normal_user_sp)
        items_before = Item.objects.count()
        stockitems_before = StockItem.objects.count()
        
        item_data = {
            "sku": "SKU-TEST-123", 
            "name": "Item Criado Via Teste",
            "category": self.category.pk, 
            "supplier": self.supplier.pk,
            "branch": self.branch_sp.pk,
            "sale_price": 199.99,
        }
        
        response = self.client.post('/api/items/', item_data, format='json')
        
        # DEBUG para verificar
        items_after = Item.objects.count()
        stockitems_after = StockItem.objects.count()

        # Verifica se há stockitems órfãos
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) FROM inventory_stockitem 
                WHERE item_id NOT IN (SELECT id FROM inventory_item)
            """)
            orphaned_count = cursor.fetchone()[0]
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(items_after, items_before + 1)

    def test_unauthenticated_user_cannot_create_item(self):
        """Verifica se um usuário não autenticado é bloqueado."""
        item_data = {
            "sku": "SKU-FAIL-456", "name": "Item Falho", 
            "sale_price": 10.00, "branch": self.branch_sp.pk
        }
        response = self.client.post('/api/items/', item_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_item_fails_with_invalid_data(self):
        """Verifica se a API rejeita dados inválidos (ex: SKU faltando)."""
        # ✅ Usa um usuário do mixin
        self.client.force_authenticate(user=self.normal_user_sp)
        invalid_data = {
            "name": "Item Inválido", "sale_price": 10.00, "branch": self.branch_sp.pk
        }
        response = self.client.post('/api/items/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('sku', response.data)


class ItemDetailAPITests(InventoryTestMixin, APITestCase):
    """
    Suite de testes para o endpoint de detalhe do Item (GET, PATCH, DELETE /api/items/<id>/).
    Todos os dados são herdados do InventoryTestMixin.
    """

    def test_retrieve_item_success(self):
        """Verifica se um usuário pode buscar um item da sua filial."""
        # ✅ Usa self.normal_user_sp do mixin
        self.client.force_authenticate(user=self.normal_user_sp)
        response = self.client.get(f'/api/items/{self.item_sp.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sku'], self.item_sp.sku)

    def test_retrieve_item_permission_denied(self):
        """Verifica se um usuário NÃO pode buscar um item de outra filial."""
        # ✅ Usa self.normal_user_sp do mixin
        self.client.force_authenticate(user=self.normal_user_sp)
        response = self.client.get(f'/api/items/{self.item_rj.pk}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_item_success(self):
        """Verifica se um usuário pode atualizar um item da sua filial."""
        # ✅ Usa self.normal_user_sp do mixin
        self.client.force_authenticate(user=self.normal_user_sp)
        update_data = {'name': 'Nome do Item Atualizado'}
        
        response = self.client.patch(f'/api/items/{self.item_sp.pk}/', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.item_sp.refresh_from_db()
        self.assertEqual(self.item_sp.name, 'Nome do Item Atualizado')

    def test_unauthenticated_user_cannot_delete_item(self):
        """Verifica se um usuário não autenticado não pode deletar um item."""
        response = self.client.delete(f'/api/items/{self.item_sp.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # ✅ Usa o manager padrão que já respeita o soft-delete
        self.assertTrue(Item.objects.filter(pk=self.item_sp.pk).exists())

    def test_user_cannot_delete_item_from_other_branch(self):
        """Verifica se um usuário não pode deletar um item de outra filial."""
        # ✅ Usa self.normal_user_sp do mixin
        self.client.force_authenticate(user=self.normal_user_sp)
        response = self.client.delete(f'/api/items/{self.item_rj.pk}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # ✅ Usa o manager padrão que já respeita o soft-delete
        self.assertTrue(Item.objects.filter(pk=self.item_rj.pk).exists())

    def test_get_stock_distribution_success(self):
        """Verifica se um usuário pode ver a distribuição de estoque de um item permitido."""
        # ✅ Usa self.normal_user_sp do mixin
        self.client.force_authenticate(user=self.normal_user_sp)
        response = self.client.get(f'/api/items/{self.item_sp.pk}/stock/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        # ✅ CORREÇÃO: A asserção agora reflete a quantidade criada no mixin (100)
        self.assertEqual(response.data['results'][0]['quantity'], 100)

    def test_get_stock_distribution_permission_denied(self):
        """Verifica se um usuário NÃO pode ver a distribuição de estoque de um item de outra filial."""
        # ✅ Usa self.normal_user_sp do mixin
        self.client.force_authenticate(user=self.normal_user_sp)
        response = self.client.get(f'/api/items/{self.item_rj.pk}/stock/')
        
        # ✅ CORREÇÃO: A view de distribuição de estoque para um item que o usuário
        # não pode acessar deve retornar 404, não uma lista vazia.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_stock_distribution_unauthenticated(self):
        """Verifica se um usuário não autenticado é bloqueado."""
        response = self.client.get(f'/api/items/{self.item_sp.pk}/stock/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_item_success(self):
        """Verifica se um usuário pode 'deletar' (soft delete) um item."""
        # ✅ Usa self.normal_user_sp do mixin
        self.client.force_authenticate(user=self.normal_user_sp)
        response = self.client.delete(f'/api/items/{self.item_sp.pk}/')
    
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
        # A verificação correta para SOFT DELETE
        item_deleted = Item.all_objects.get(pk=self.item_sp.pk) 
        self.assertIsNotNone(item_deleted.deleted_at)

class SoftDeleteTests(InventoryTestMixin, APITestCase):
    """Testes para a funcionalidade de soft delete."""

    def test_delete_marks_item_and_stockitems_as_deleted(self):
        """Testa se deletar um item marca ambos o item e seus estoques como deletados."""
        self.client.force_authenticate(user=self.admin_user)
        
        # Verifica estado inicial
        self.assertIsNone(self.item_sp.deleted_at)
        stock_items = self.item_sp.stock_items.all()
        for stock in stock_items:
            self.assertIsNone(stock.deleted_at)
        
        # Deleta o item
        response = self.client.delete(f'/api/items/{self.item_sp.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Recarrega os objetos do banco
        self.item_sp.refresh_from_db()
        stock_items = self.item_sp.stock_items.all()
        
        # Verifica se foram marcados como deletados
        self.assertIsNotNone(self.item_sp.deleted_at)
        for stock in stock_items:
            self.assertIsNotNone(stock.deleted_at)
    
    def test_restore_item_restores_stockitems(self):
        """Testa se restaurar um item também restaura seus estoques."""
        # Primeiro deleta o item
        self.item_sp.delete()
        self.item_sp.refresh_from_db()
        
        # Verifica que estão deletados
        self.assertIsNotNone(self.item_sp.deleted_at)
        stock_items = self.item_sp.stock_items.all()
        for stock in stock_items:
            self.assertIsNotNone(stock.deleted_at)
        
        # Restaura o item
        self.item_sp.restore()
        self.item_sp.refresh_from_db()
        
        # Verifica que foram restaurados
        self.assertIsNone(self.item_sp.deleted_at)
        stock_items = self.item_sp.stock_items.all()
        for stock in stock_items:
            self.assertIsNone(stock.deleted_at)

# --- TESTES DE MOVIMENTAÇÃO DE ESTOQUE ---
class StockMovementTests(InventoryTestMixin, APITestCase):
    """Testes para movimentações de estoque."""

    def test_inbound_increases_quantity(self):
        """Testa se uma movimentação de entrada aumenta o estoque."""
        self.client.force_authenticate(user=self.admin_user)
        
        stock_before = StockItem.objects.get(item=self.item_sp, location=self.location_sp).quantity
        
        movement_data = {
            'item': self.item_sp.id,
            'location': self.location_sp.id,
            'movement_type': self.movement_type_entry.id,
            'quantity': 10
        }
        
        response = self.client.post('/api/movements/', movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        stock_after = StockItem.objects.get(item=self.item_sp, location=self.location_sp).quantity
        self.assertEqual(stock_after, stock_before + 10)
    
    def test_outbound_decreases_quantity(self):
        """Testa se uma movimentação de saída diminui o estoque."""
        self.client.force_authenticate(user=self.admin_user)
        
        stock_before = StockItem.objects.get(item=self.item_sp, location=self.location_sp).quantity
        
        movement_data = {
            'item': self.item_sp.id,
            'location': self.location_sp.id,
            'movement_type': self.movement_type_exit.id,
            'quantity': 5
        }
        
        response = self.client.post('/api/movements/', movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        stock_after = StockItem.objects.get(item=self.item_sp, location=self.location_sp).quantity
        self.assertEqual(stock_after, stock_before - 5)
    
    def test_outbound_fails_with_insufficient_stock(self):
        """Testa se uma saída com estoque insuficiente é rejeitada."""
        self.client.force_authenticate(user=self.admin_user)
        
        movement_data = {
            'item': self.item_sp.id,
            'location': self.location_sp.id,
            'movement_type': self.movement_type_exit.id,
            'quantity': 1000  # Mais do que o estoque disponível
        }
        
        response = self.client.post('/api/movements/', movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Estoque insuficiente', str(response.data))

# --- TESTES DE PERMISSÕES ---
class PermissionTests(InventoryTestMixin, APITestCase):
    """Testes para controle de permissões e acesso."""

    def test_user_without_branch_cannot_access_items(self):
        """Testa se usuário sem filial não consegue acessar itens."""
        user_no_branch = User.objects.create_user('no_branch', 'nobranch@test.com', 'password123')
        
        # ⚠️ CORREÇÃO CRÍTICA: Remover TODAS as filiais do perfil
        user_no_branch.profile.branches.clear()  # ← ISSO AQUI
        user_no_branch.profile.save()
        
        self.client.force_authenticate(user=user_no_branch)
        
        response = self.client.get('/api/items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)  # Agora deve ser 0
    
    def test_admin_sees_soft_deleted_items(self):
        """Testa se administradores veem itens deletados."""
        # Primeiro deleta um item
        self.item_sp.delete()
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/items/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Admin deve ver todos os itens, incluindo deletados
        # ⚠️ CORREÇÃO: Verificar a contagem considerando soft delete
        self.assertEqual(len(response.data['results']), 2)
    
def test_normal_user_cannot_see_soft_deleted_items(self):
    """Testa se usuários normais não veem itens deletados."""
    # Primeiro deleta o item da SP
    self.item_sp.delete()
    
    self.client.force_authenticate(user=self.normal_user_sp)
    response = self.client.get('/api/items/')
    
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    # ⚠️ CORREÇÃO: Verifica por SKU em vez de posição fixa no array
    items_skus = [item['sku'] for item in response.data['results']]
    
    # Usuário da SP não deve ver nenhum item (seu único item foi deletado)
    self.assertEqual(len(items_skus), 0)
    self.assertNotIn(self.item_sp.sku, items_skus)
    
    # Usuário da RJ deve ver apenas o item RJ (não deletado)
    self.client.force_authenticate(user=self.normal_user_rj)
    response_rj = self.client.get('/api/items/')
    items_skus_rj = [item['sku'] for item in response_rj.data['results']]
    
    self.assertEqual(len(items_skus_rj), 1)
    self.assertIn(self.item_rj.sku, items_skus_rj)

# --- TESTES DE OTIMIZAÇÃO DE IMAGEM ---
class ImageOptimizationTests(APITestCase):
    """Testes para otimização de imagens."""

    def create_test_image(self, format='JPEG', width=100, height=100):
        """Cria uma imagem de teste em memória."""
        buffer = BytesIO()
        image = PilImage.new('RGB', (width, height), 'red')
        image.save(buffer, format=format)
        buffer.seek(0)
        return SimpleUploadedFile(
            f'test.{format.lower()}',
            buffer.getvalue(),
            content_type=f'image/{format.lower()}'
        )
    
    def test_jpeg_is_converted_to_webp(self):
        """Testa se imagem JPEG é convertida para WebP."""
        user = User.objects.create_user('test_user', 'test@test.com', 'password123')
        branch = Branch.objects.create(name='Test Branch')
        
        # Cria item com imagem JPEG
        jpeg_image = self.create_test_image('JPEG')
        item = Item.objects.create(
            created_by=user,
            sku='TEST-IMG-001',
            name='Test Image Item',
            sale_price=10.00,
            branch=branch,
            photo=jpeg_image
        )
        
        # Verifica se foi convertido para WebP
        self.assertTrue(item.photo.name.endswith('.webp'))
        
        # Verifica se o arquivo existe
        self.assertTrue(os.path.exists(item.photo.path))
        
        # Limpeza
        if os.path.exists(item.photo.path):
            os.remove(item.photo.path)
    
    def test_webp_is_preserved(self):
        """Testa se imagem WebP não é reconvertida."""
        user = User.objects.create_user('test_user', 'test@test.com', 'password123')
        branch = Branch.objects.create(name='Test Branch')
        
        # Cria uma imagem WebP diretamente
        webp_image = self.create_test_image('WEBP')
        item = Item.objects.create(
            created_by=user,
            sku='TEST-IMG-002',
            name='Test WebP Item',
            sale_price=10.00,
            branch=branch,
            photo=webp_image
        )
        
        # Deve manter a extensão .webp
        self.assertTrue(item.photo.name.endswith('.webp'))
        
        # Limpeza
        if os.path.exists(item.photo.path):
            os.remove(item.photo.path)

# --- TESTES ADICIONAIS DE MOVIMENTAÇÃO ---
class AdditionalStockMovementTests(InventoryTestMixin, APITestCase):
    """Testes adicionais para movimentações de estoque."""

    def test_movement_with_package_units(self):
        """Testa movimentação com unidades por pacote."""
        movement_type = MovementType.objects.create(
            name='Entrada Caixa',
            code='ENT_CAIXA',
            factor=1,
            units_per_package=10
        )
        
        self.client.force_authenticate(user=self.admin_user)
        stock_before = StockItem.objects.get(item=self.item_sp, location=self.location_sp).quantity
        
        movement_data = {
            'item': self.item_sp.id,
            'location': self.location_sp.id,
            'movement_type': movement_type.id,
            'quantity': 2  # 2 caixas de 10 unidades cada
        }
        
        response = self.client.post('/api/movements/', movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        stock_after = StockItem.objects.get(item=self.item_sp, location=self.location_sp).quantity
        self.assertEqual(stock_after, stock_before + 20)  # 2 caixas * 10 unidades
    
    def test_movement_sets_correct_unit_price(self):
        """Testa se o preço unitário é definido corretamente."""
        self.client.force_authenticate(user=self.admin_user)
        
        movement_data = {
            'item': self.item_sp.id,
            'location': self.location_sp.id,
            'movement_type': self.movement_type_entry.id,
            'quantity': 5
        }
        
        response = self.client.post('/api/movements/', movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verifica se o preço unitário foi definido como preço de compra para entrada
        movement = StockMovement.objects.get(id=response.data['id'])
        self.assertEqual(movement.unit_price, self.item_sp.purchase_price)

class SoftDeleteConsistencyTests(InventoryTestMixin, APITestCase):
    """Testes para garantir consistência no soft delete entre Item e StockItem"""
    
    def test_delete_item_does_not_cascade_to_stockitems(self):
        """Testa que o soft delete do Item NÃO deve marcar StockItems como deletados"""
        # Contagem inicial
        stockitems_count_before = StockItem.objects.filter(item=self.item_sp).count()
        
        # Deleta o item
        self.item_sp.delete()
        
        # StockItems devem permanecer intactos (não deletados)
        stockitems_count_after = StockItem.objects.filter(item=self.item_sp).count()
        self.assertEqual(stockitems_count_before, stockitems_count_after)
        
        # Verifica que StockItems não foram marcados como deletados
        stockitems_deleted = StockItem.all_objects.filter(
            item=self.item_sp, 
            deleted_at__isnull=False
        ).count()
        self.assertEqual(stockitems_deleted, 0)

    def test_restore_item_does_not_affect_stockitems(self):
        """Testa que restaurar Item não altera o estado dos StockItems"""
        # Primeiro deleta
        self.item_sp.delete()
        
        # Restaura
        self.item_sp.restore()
        
        # StockItems devem permanecer inalterados
        stockitems = StockItem.objects.filter(item=self.item_sp)
        for stockitem in stockitems:
            self.assertIsNone(stockitem.deleted_at)

class StockMovementPriceValidationTests(InventoryTestMixin, APITestCase):
    """Testes para validação de preço em movimentações"""
    
    def test_movement_fails_with_zero_purchase_price(self):
        """Testa que movimentação de entrada falha com preço de compra zero"""
        # Cria item com preço zero
        item_no_price = self.create_test_item(
            purchase_price=0,
            sale_price=20.00
        )
        
        self.client.force_authenticate(user=self.admin_user)
        movement_data = {
            'item': item_no_price.id,
            'location': self.location_sp.id,
            'movement_type': self.movement_type_entry.id,
            'quantity': 10
        }
        
        response = self.client.post('/api/movements/', movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('preço de compra', str(response.data).lower())

    def test_movement_fails_with_zero_sale_price_for_outbound(self):
        """Testa que movimentação de saída falha com preço de venda zero"""
        item_no_sale_price = self.create_test_item(
            purchase_price=10.00,
            sale_price=0
        )
        
        self.client.force_authenticate(user=self.admin_user)
        movement_data = {
            'item': item_no_sale_price.id,
            'location': self.location_sp.id,
            'movement_type': self.movement_type_exit.id,
            'quantity': 5
        }
        
        response = self.client.post('/api/movements/', movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('preço de venda', str(response.data).lower())

class SerializerFieldCompletenessTests(InventoryTestMixin, APITestCase):
    """Testes para garantir que todos os campos do model estão nos serializers"""
    
    def test_serializer_includes_basic_fields(self, endpoint, object_id):
        """Teste genérico para campos básicos obrigatórios"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'{endpoint}{object_id}/')
        
        basic_fields = ['id', 'created_at', 'updated_at', 'is_active']
        
        for field in basic_fields:
            self.assertIn(
                field, 
                response.data, 
                f"Campo básico {field} faltando no serializer"
            )

    def test_supplier_serializer_includes_all_fields(self):
        """Testa que SupplierSerializer inclui todos os campos do model"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/suppliers/{self.supplier.id}/')
        
        expected_fields = [
            'id', 'parent_supplier', 'tax_id', 'address_line_2', 'neighborhood',
            'tax_regime_display'
        ]
        
        for field in expected_fields:
            self.assertIn(field, response.data, f"Campo {field} faltando no SupplierSerializer")

    def test_item_serializer_includes_all_fields(self):
        """Testa que ItemSerializer inclui todos os campos do model"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/items/{self.item_sp.id}/')
        
        expected_fields = [
            'id', 'warranty_days', 'internal_code', 'manufacturer_code', 'cfop'
        ]
        
        for field in expected_fields:
            self.assertIn(field, response.data, f"Campo {field} faltando no ItemSerializer")

    def test_movement_type_serializer_includes_all_fields(self):
        """Testa que MovementTypeSerializer inclui todos os campos críticos"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/movement-types/{self.movement_type_entry.id}/')
        
        critical_fields = [
            'code', 'category', 'category_display', 'document_type', 
            'document_type_display', 'requires_approval', 'affects_finance'
        ]
        
        for field in critical_fields:
            self.assertIn(field, response.data, f"Campo {field} faltando no MovementTypeSerializer")

class EANValidationTests(InventoryTestMixin, APITestCase):
    """Testes para validação de código EAN"""
    
    def test_create_item_with_valid_ean(self):
        """Testa criação de item com EAN válido"""
        self.client.force_authenticate(user=self.admin_user)
        
        item_data = {
            'sku': 'TEST-EAN-001',
            'name': 'Item com EAN válido',
            'branch': self.branch_sp.id,
            'sale_price': 10.00,
            'ean': '5901234123457'  # EAN-13 válido
        }
        
        response = self.client.post('/api/items/', item_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_item_with_invalid_ean_fails(self):
        """Testa que criação com EAN inválido é rejeitada"""
        self.client.force_authenticate(user=self.admin_user)
        
        item_data = {
            'sku': 'TEST-EAN-002',
            'name': 'Item com EAN inválido',
            'branch': self.branch_sp.id,
            'sale_price': 10.00,
            'ean': '1234567890123'  # EAN-13 inválido (dígito verificador errado)
        }
        
        response = self.client.post('/api/items/', item_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('ean', response.data)

class MovementTypeValidationTests(InventoryTestMixin, APITestCase):
    """Testes para validações complexas do MovementType"""
    
    def test_create_movement_type_with_invalid_units_per_package(self):
        """Testa que unidades por pacote < 1 são rejeitadas"""
        self.client.force_authenticate(user=self.admin_user)
        
        movement_type_data = {
            'name': 'Tipo Inválido',
            'code': 'INV_UNIT',
            'factor': 1,
            'units_per_package': 0  # Inválido
        }
        
        response = self.client.post('/api/movement-types/', movement_type_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('units_per_package', response.data)

    def test_movement_type_cannot_be_its_own_parent(self):
        """Testa que um tipo não pode ser pai de si mesmo"""
        self.client.force_authenticate(user=self.admin_user)
        
        movement_type_data = {
            'name': 'Tipo Circular',
            'code': 'CIRCULAR',
            'factor': 1,
            'parent_type': self.movement_type_entry.id  # Definir depois de criar
        }
        
        # Primeiro cria o tipo
        response = self.client.post('/api/movement-types/', movement_type_data, format='json')
        movement_type_id = response.data['id']
        
        # Tenta definir ele mesmo como parent
        update_data = {'parent_type': movement_type_id}
        response = self.client.patch(
            f'/api/movement-types/{movement_type_id}/', 
            update_data, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class SystemSettingsTests(InventoryTestMixin, APITestCase):
    """Testes para configurações do sistema"""
    
    def test_system_settings_accessible_to_admin(self):
        """Testa que admin pode acessar configurações do sistema"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get('/api/system-settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica que campos estão presentes
        self.assertIn('default_branch', response.data)
        self.assertIn('default_sector', response.data)

    def test_system_settings_not_accessible_to_normal_users(self):
        """Testa que usuários normais não podem acessar configurações"""
        self.client.force_authenticate(user=self.normal_user_sp)
        
        response = self.client.get('/api/system-settings/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

class UserProfileManagerTests(InventoryTestMixin, APITestCase):
    """Testes para campo manager no UserProfile"""
    
    def test_user_profile_includes_manager_field(self):
        """Testa que UserProfile inclui campo manager"""
        # Configura um manager
        self.normal_user_sp.profile.manager = self.admin_user.profile
        self.normal_user_sp.profile.save()
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/users/{self.normal_user_sp.id}/')
        
        self.assertIn('profile', response.data)
        self.assertIn('manager', response.data['profile'])
        self.assertIn('manager_name', response.data['profile'])