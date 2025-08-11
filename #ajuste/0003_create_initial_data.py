from django.db import migrations

def create_initial_data(apps, schema_editor):
    """
    Cria os dados iniciais essenciais para o funcionamento do sistema,
    como Local de Recebimento, Categoria Padrão e Fornecedor Padrão.
    """
    # Usamos apps.get_model para obter os modelos na versão correta para esta migração
    Location = apps.get_model('inventory', 'Location')
    Category = apps.get_model('inventory', 'Category')
    Supplier = apps.get_model('inventory', 'Supplier')

    # Cria a localização "Recebimento"
    # O método get_or_create evita erros se o registro já existir
    Location.objects.get_or_create(
        name='Recebimento',
        defaults={'warehouse': 'Padrão'}
    )

    # Cria a categoria "Não Categorizado"
    Category.objects.get_or_create(
        name='Não Categorizado'
    )

    # Cria o fornecedor "Avulso / Não Identificado"
    Supplier.objects.get_or_create(
        name='Avulso / Não Identificado'
    )


class Migration(migrations.Migration):

    dependencies = [
        # Garante que esta migração rode DEPOIS da que cria os Tipos de Movimentação
        ('inventory', '0002_create_default_movement_types'),
    ]

    operations = [
        migrations.RunPython(create_initial_data),
    ]