from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import UserProfile, Branch, Sector

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        # O perfil ainda é criado automaticamente
        profile = UserProfile.objects.create(user=instance)
        
        # LÓGICA ADICIONAL: Definindo permissões padrão
        try:
            # Tenta encontrar a filial e o setor padrão
            default_branch = Branch.objects.get(name='Filial Principal')
            default_sector = Sector.objects.get(name='Estoque', branch=default_branch)
            
            # Associa o novo perfil a eles
            profile.branches.add(default_branch)
            profile.sectors.add(default_sector)
            
        except (Branch.DoesNotExist, Sector.DoesNotExist):
            # Se os padrões não existirem, não faz nada.
            # Em um sistema real, poderíamos registrar um log de erro aqui.
            pass
