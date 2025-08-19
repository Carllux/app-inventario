# inventory/signals.py
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile, SystemSettings

@receiver(post_save, sender=User, dispatch_uid="create_user_profile")
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Signal ATÔMICO e seguro que não interfere em transações de teste
    """
    if created:
        try:
            # Usa transação atômica para evitar conflitos
            with transaction.atomic():
                # Verifica se já existe profile antes de criar
                if not hasattr(instance, 'profile'):
                    profile = UserProfile.objects.create(user=instance)
                    
                    # Tenta adicionar configurações padrão de forma segura
                    try:
                        settings = SystemSettings.get_solo()
                        if settings.default_branch:
                            profile.branches.add(settings.default_branch)
                        if settings.default_sector:
                            profile.sectors.add(settings.default_sector)
                    except Exception:
                        # Ignora erros de configuração silenciosamente
                        pass
                        
        except Exception as e:
            # Log do erro mas não quebra a aplicação
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Erro no signal de perfil: {e}")