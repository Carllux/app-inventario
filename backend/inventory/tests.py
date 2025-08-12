# backend/inventory/tests.py

from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import Branch, Item, Location, StockItem, StockMovement, UserProfile, MovementType
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

    def test_normal_user_sees_only_their_branch_items(self):
        """
        Verifica se um usuário normal vê APENAS os itens da sua filial.
        """
        # Simula o login do usuário da Filial SP
        self.client.force_authenticate(user=self.normal_user_sp)
        
            # Testa filtro por localização
        response = self.client.get('/api/items/?location=' + str(self.location_sp.id))
        self.assertEqual(len(response.data['results']), 1)

        # Testa que não pode acessar localização de outra filial
        # PARA:
        response = self.client.get('/api/items/?stock_items__location=' + str(self.location_rj.id))
        self.assertEqual(len(response.data['results']), 0)
        
        # Faz a requisição para a API
        response = self.client.get('/api/items/')
        
        # Verificações (Asserts)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Esperamos que a resposta contenha APENAS 1 item
        self.assertEqual(len(response.data['results']), 1)
        # Verificamos se o item retornado é de fato o item de SP
        self.assertEqual(response.data['results'][0]['sku'], self.item_sp.sku)

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

class StockMovementAPITests(APITestCase):
    """
    Suite de testes para o endpoint de criação de Movimentações (/api/movements/).
    """

    def setUp(self):
        """
        Cria um cenário base para os testes de movimentação.
        """
        # --- Criar Usuários e Hierarquia ---
        self.admin_user = User.objects.create_superuser('admin_mov', 'admin_mov@test.com', 'password123')
        self.branch = Branch.objects.create(name='Filial Teste Mov')
        self.location = Location.objects.create(branch=self.branch, location_code='MOV-A1', name='Prateleira Mov')
        
        # --- Criar Item e Tipo de Movimentação ---
        self.item = Item.objects.create(owner=self.admin_user, sku='SKU-MOV-001', name='Item para Movimentar', sale_price=50.00, purchase_price=25.00)
        self.entry_type = MovementType.objects.create(name='Entrada Teste', factor=1)
        
        # Opcional: Criar um estoque inicial para testar saídas
        StockItem.objects.create(item=self.item, location=self.location, quantity=50)

    def test_authenticated_user_can_create_movement(self):
        """
        Verifica se um usuário logado pode criar uma movimentação com dados válidos.
        """
        logging.info("\n--- INICIANDO: test_authenticated_user_can_create_movement ---")
        
        # Simula o login do usuário
        self.client.force_authenticate(user=self.admin_user)
        logging.info(f"Usuário autenticado: {self.admin_user.username}")

        # Pega o saldo de estoque ANTES da movimentação
        stock_before = StockItem.objects.get(item=self.item, location=self.location).quantity
        logging.info(f"Estoque inicial do item '{self.item.name}': {stock_before}")
        
        # Dados da nova movimentação
        movement_data = {
            'item': self.item.pk,
            'location': self.location.pk,
            'movement_type': self.entry_type.pk,
            'quantity': 10
        }
        logging.info(f"Enviando dados da movimentação: {movement_data}")

        # Faz a requisição POST para a API
        response = self.client.post('/api/movements/', movement_data, format='json')
        
        # Verificações (Asserts) com mensagens de erro personalizadas
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Erro! A API retornou status {response.status_code} em vez de 201. Resposta: {response.data}")
        logging.info("SUCESSO: A API retornou status 201 Created.")

        # Verifica se a movimentação foi realmente criada no banco de dados
        self.assertEqual(StockMovement.objects.count(), 1, "A movimentação não foi criada no banco de dados.")
        logging.info("SUCESSO: Movimentação criada no banco.")
        
        # A verificação mais importante: o saldo do estoque foi atualizado corretamente?
        stock_after = StockItem.objects.get(item=self.item, location=self.location).quantity
        expected_stock = stock_before + movement_data['quantity']
        
        logging.info(f"Estoque final do item '{self.item.name}': {stock_after}")
        logging.info(f"Estoque esperado: {expected_stock}")

        self.assertEqual(stock_after, expected_stock, f"O saldo final do estoque está incorreto! Esperado: {expected_stock}, Recebido: {stock_after}")
        logging.info("SUCESSO: Saldo do estoque atualizado corretamente.")
        logging.info("--- TESTE CONCLUÍDO: test_authenticated_user_can_create_movement ---\n")


    def test_unauthenticated_user_cannot_create_movement(self):
        """
        Verifica se um usuário não logado é bloqueado ao tentar criar uma movimentação.
        """
        movement_data = {
            'item': self.item.pk,
            'location': self.location.pk,
            'movement_type': self.entry_type.pk,
            'quantity': 10
        }
        
        response = self.client.post('/api/movements/', movement_data, format='json')
        
        # Esperamos um erro 401 Unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_movement_fails_with_missing_data(self):
        """
        Verifica se a API rejeita a criação de uma movimentação se faltarem dados essenciais.
        """
        self.client.force_authenticate(user=self.admin_user)
        
        # Dados inválidos (faltando 'item')
        invalid_data = {
            'location': self.location.pk,
            'movement_type': self.entry_type.pk,
            'quantity': 10
        }
        
        response = self.client.post('/api/movements/', invalid_data, format='json')
        
        # Esperamos um erro 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Verificamos que o erro é especificamente sobre o campo 'item'
        self.assertIn('item', response.data)
        
    def test_movement_quantity_must_be_positive(self):
        """Verifica se a API rejeita quantidades negativas ou zero"""
        self.client.force_authenticate(user=self.admin_user)

        invalid_data = {
            'item': self.item.pk,
            'location': self.location.pk,
            'movement_type': self.entry_type.pk,
            'quantity': 0  # Valor inválido
        }

        response = self.client.post('/api/movements/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('quantity', response.data)

    def test_outbound_movement_fails_with_insufficient_stock(self):
        """Verifica se saídas com estoque insuficiente são rejeitadas"""
        # Cria um tipo de saída (factor negativo)
        outbound_type = MovementType.objects.create(name='Saída Teste', factor=-1)

        self.client.force_authenticate(user=self.admin_user)

        invalid_data = {
            'item': self.item.pk,
            'location': self.location.pk,
            'movement_type': outbound_type.pk,
            'quantity': 1000  # Quantidade maior que o estoque
        }

        response = self.client.post('/api/movements/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)        