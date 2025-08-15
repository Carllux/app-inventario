from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import (
    Branch,
    Category,
    Item,
    Location,
    MovementType,
    StockItem,
    StockMovement,
    Supplier,
    UserProfile
)

import logging

class ItemAPITests(APITestCase):
    """
    Suite de testes para o endpoint de listagem de Itens (/api/items/).
    """

# Em inventory/tests.py, dentro da classe ItemAPITests

    def setUp(self):
        """
        Este método é executado ANTES de cada teste.
        Ele cria um cenário de dados consistente para todos os testes.
        """
        # --- Criar Usuários ---
        self.admin_user = User.objects.create_superuser('admin', 'admin@test.com', 'password123')
        self.normal_user_sp = User.objects.create_user('user_sp', 'sp@test.com', 'password123')
        self.normal_user_rj = User.objects.create_user('user_rj', 'rj@test.com', 'password123')

        # --- Criar Hierarquia Organizacional ---
        self.branch_sp = Branch.objects.create(name='Filial SP')
        self.branch_rj = Branch.objects.create(name='Filial RJ')

        self.location_sp = Location.objects.create(branch=self.branch_sp, location_code='SP-A1', name='Prateleira SP')
        self.location_rj = Location.objects.create(branch=self.branch_rj, location_code='RJ-B2', name='Prateleira RJ')

        # --- ✅ CORREÇÃO: Criar Perfis e Associar Permissões Manualmente ---
        # User SP só tem acesso à Filial SP
        profile_sp = UserProfile.objects.create(user=self.normal_user_sp)
        profile_sp.branches.add(self.branch_sp)

        # User RJ só tem acesso à Filial RJ
        profile_rj = UserProfile.objects.create(user=self.normal_user_rj)
        profile_rj.branches.add(self.branch_rj)

        # --- Criar Itens e Estoque ---
        self.item_sp = Item.objects.create(owner=self.admin_user, sku='SKU-SP-001', name='Item de SP', sale_price=10.00)
        self.item_rj = Item.objects.create(owner=self.admin_user, sku='SKU-RJ-002', name='Item de RJ', sale_price=20.00)

        # Adiciona estoque para cada item em seu respectivo local
        StockItem.objects.create(item=self.item_sp, location=self.location_sp, quantity=100)
        StockItem.objects.create(item=self.item_rj, location=self.location_rj, quantity=50)


    def test_unauthenticated_user_cannot_access_items(self):
        """
        Verifica se um usuário não autenticado recebe erro 401 (Unauthorized).
        """
        response = self.client.get('/api/items/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_is_filtered_by_user_branch(self):
        """
        Verifica se a listagem geral para um usuário normal retorna apenas os itens de sua filial.
        """
        # Simula o login do usuário da Filial SP
        self.client.force_authenticate(user=self.normal_user_sp)
        
        # Faz a requisição GERAL para a API
        response = self.client.get('/api/items/')
        
        # Verificações (Asserts)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Esperamos que a resposta contenha APENAS 1 item
        self.assertEqual(len(response.data['results']), 1)
        # Verificamos se o item retornado é de fato o item de SP
        self.assertEqual(response.data['results'][0]['sku'], self.item_sp.sku)
    
    def test_user_can_filter_by_accessible_location(self):
        """
        Verifica se um usuário pode filtrar por uma localização à qual ele tem acesso.
        """
        self.client.force_authenticate(user=self.normal_user_sp)
        
        # Testa o filtro por uma localização PERMITIDA
        url = f'/api/items/?stock_items__location={self.location_sp.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_user_cannot_filter_by_inaccessible_location(self):
        """
        Verifica se o filtro por uma localização PROIBIDA retorna uma lista vazia.
        """
        self.client.force_authenticate(user=self.normal_user_sp)
        
        # Testa o filtro por uma localização PROIBIDA (da filial do RJ)
        url = f'/api/items/?stock_items__location={self.location_rj.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # A verificação crucial: esperamos que a lista de resultados seja VAZIA
        self.assertEqual(len(response.data['results']), 0)

    def test_admin_user_sees_all_items(self):
        """
        Verifica se um usuário administrador (staff) vê TODOS os itens de TODAS as filiais.
        """
        # Simula o login do usuário admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Faz a requisição para a API
        response = self.client.get('/api/items/')
        
        # Verificações (Asserts)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Esperamos que a resposta contenha os 2 itens que criamos
        self.assertEqual(len(response.data['results']), 2)

        # Adicione este código ao final do arquivo backend/inventory/tests.py


 # Mantenha as outras classes de teste (ItemListAPITests e ItemCreateAPITests) como estão.
# Substitua apenas as duas classes StockMovementAPITests por esta.

class StockMovementAPITests(APITestCase):
    """
    Suite de testes para o endpoint de criação de Movimentações (/api/movements/).
    """

    def setUp(self):
        """
        Cria um cenário base para os testes de movimentação.
        """
        self.user = User.objects.create_user('testuser_mover', 'mover@test.com', 'password123')
        self.branch = Branch.objects.create(name='Filial Teste Mov')
        self.location = Location.objects.create(branch=self.branch, location_code='MOV-A1', name='Prateleira Mov')
        self.item = Item.objects.create(owner=self.user, sku='SKU-MOV-001', name='Item para Movimentar', sale_price=50.00, purchase_price=25.00)
        self.entry_type = MovementType.objects.create(name='Entrada Teste', factor=1)
        
        # Cria um estoque inicial de 50 unidades para o item
        StockItem.objects.create(item=self.item, location=self.location, quantity=50)

    def test_authenticated_user_can_create_movement(self):
        """Verifica se um usuário logado pode criar uma movimentação com dados válidos."""
        self.client.force_authenticate(user=self.user)
        stock_before = StockItem.objects.get(item=self.item, location=self.location).quantity
        
        movement_data = {
            'item': self.item.pk,
            'location': self.location.pk,
            'movement_type': self.entry_type.pk,
            'quantity': 10
        }
        response = self.client.post('/api/movements/', movement_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"A API falhou com o erro: {response.data}")
        
        stock_after = StockItem.objects.get(item=self.item, location=self.location).quantity
        self.assertEqual(stock_after, stock_before + 10)

    def test_unauthenticated_user_cannot_create_movement(self):
        """Verifica se um usuário não logado é bloqueado."""
        movement_data = {
            'item': self.item.pk, 'location': self.location.pk,
            'movement_type': self.entry_type.pk, 'quantity': 10
        }
        response = self.client.post('/api/movements/', movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_movement_fails_with_missing_data(self):
        """Verifica a rejeição de dados essenciais faltando."""
        self.client.force_authenticate(user=self.user)
        invalid_data = {
            'location': self.location.pk,
            'movement_type': self.entry_type.pk,
            'quantity': 10
        }
        response = self.client.post('/api/movements/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('item', str(response.data))
        
    def test_movement_quantity_must_be_positive(self):
        """Verifica a rejeição de quantidade zero ou negativa."""
        self.client.force_authenticate(user=self.user)
        invalid_data = {
            'item': self.item.pk, 'location': self.location.pk,
            'movement_type': self.entry_type.pk, 'quantity': 0
        }
        response = self.client.post('/api/movements/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('quantity', str(response.data))

    def test_outbound_movement_fails_with_insufficient_stock(self):
        """Verifica se saídas com estoque insuficiente são rejeitadas."""
        outbound_type = MovementType.objects.create(name='Saída Teste', factor=-1)
        self.client.force_authenticate(user=self.user)
        invalid_data = {
            'item': self.item.pk, 'location': self.location.pk,
            'movement_type': outbound_type.pk,
            'quantity': 100 # Mais do que as 50 unidades em estoque
        }
        response = self.client.post('/api/movements/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Estoque insuficiente', str(response.data))

class ItemListAPITests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser('admin', 'admin@test.com', 'password123')
        self.normal_user_sp = User.objects.create_user('user_sp', 'sp@test.com', 'password123')
        self.branch_sp = Branch.objects.create(name='Filial SP')
        self.location_sp = Location.objects.create(branch=self.branch_sp, location_code='SP-A1', name='Prateleira SP')
        profile_sp = UserProfile.objects.create(user=self.normal_user_sp)
        profile_sp.branches.add(self.branch_sp)
        self.item_sp = Item.objects.create(owner=self.admin_user, sku='SKU-SP-001', name='Item de SP', sale_price=10.00)
        StockItem.objects.create(item=self.item_sp, location=self.location_sp, quantity=100)

    def test_unauthenticated_user_cannot_access_items(self):
        response = self.client.get('/api/items/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_normal_user_sees_only_their_branch_items(self):
        self.client.force_authenticate(user=self.normal_user_sp)
        response = self.client.get('/api/items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['sku'], self.item_sp.sku)

    def test_admin_user_sees_all_items(self):
        # Cenário adicional
        branch_rj = Branch.objects.create(name='Filial RJ')
        location_rj = Location.objects.create(branch=branch_rj, location_code='RJ-B2', name='Prateleira RJ')
        item_rj = Item.objects.create(owner=self.admin_user, sku='SKU-RJ-002', name='Item de RJ', sale_price=20.00)
        StockItem.objects.create(item=item_rj, location=location_rj, quantity=50)
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)


# --- SUÍTE 2: TESTES PARA A CRIAÇÃO DE ITENS (POST) ---
class ItemCreateAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser_creator', 'creator@test.com', 'password123')
        self.category = Category.objects.create(name='Categoria Teste')
        self.supplier = Supplier.objects.create(name='Fornecedor Teste', country='BR')

    def test_authenticated_user_can_create_item(self):
        self.client.force_authenticate(user=self.user)
        item_data = {
            "sku": "SKU-TEST-123", "name": "Item Criado Via Teste",
            "category": self.category.pk, "supplier": self.supplier.pk,
            "sale_price": 199.99, "purchase_price": 100.00
        }
        response = self.client.post('/api/items/', item_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Item.objects.count(), 1)
        self.assertEqual(Item.objects.get().owner, self.user)

    def test_unauthenticated_user_cannot_create_item(self):
        item_data = {"sku": "SKU-FAIL-456", "name": "Item Falho", "sale_price": 10.00}
        response = self.client.post('/api/items/', item_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_item_fails_with_invalid_data(self):
        self.client.force_authenticate(user=self.user)
        invalid_data = {"name": "Item Inválido", "sale_price": 10.00}
        response = self.client.post('/api/items/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('sku', response.data)


