import sys

def main():
    print("="*60)
    print("CRITICAL DEPLOYMENT ERROR: WRONG RUNTIME DETECTED")
    print("="*60)
    print("You are trying to run this application using the native Python Runtime on Render.")
    print("However, this application requires NODE.JS to run the UPLim engine.")
    print("")
    print("PLEASE FIX YOUR DEPLOYMENT:")
    print("1. Go to Render Dashboard.")
    print("2. Create a 'New Blueprint' and connect this repo (Recommended).")
    print("   OR")
    print("3. Create a 'Web Service' but select 'Docker' as the Environment/Runtime.")
    print("")
    print("Resources:")
    print("- https://render.com/docs/docker")
    print("="*60)
    sys.exit(1)

if __name__ == "__main__":
    main()
