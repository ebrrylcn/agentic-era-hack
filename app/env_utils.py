import os
from dotenv import load_dotenv, find_dotenv

_ENV_LOADED = False

def ensure_env_loaded() -> None:
    global _ENV_LOADED
    if _ENV_LOADED:
        return

    # Load only the root .env so all modules share the same config
    root_env = find_dotenv('.env', raise_error_if_not_found=False)
    if root_env:
        load_dotenv(dotenv_path=root_env, override=False)

    _ENV_LOADED = True

def get_env(key: str, default: str | None = None) -> str | None:
    ensure_env_loaded()
    return os.environ.get(key, default)
