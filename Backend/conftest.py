import sys
from pathlib import Path

# Add the Backend directory to Python path so tests can import the app module
backend_dir = str(Path(__file__).parent)
if backend_dir not in sys.path:
	sys.path.append(backend_dir)
