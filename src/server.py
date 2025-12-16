import sys

print("""
================================================================================
CRITICAL DEPLOYMENT ERROR
================================================================================
You are currently running in the 'Python' runtime environment on Render.
This application requires the 'Docker' runtime to function correctly because
it depends on both Python (Flask) and Node.js (UPLim CLI).

RESOLUTION:
1. Go to your Render Dashboard.
2. Select this service.
3. Go to 'Settings' -> 'Runtime'.
4. Change 'Runtime' from 'Python 3' to 'Docker'.
5. Save and Redeploy.
================================================================================
""")
sys.exit(1)
