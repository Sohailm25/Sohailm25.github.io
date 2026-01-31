import os
import sys

sys.path.append(os.curdir)
from pelicanconf import *

SITEURL = "https://sohailmo.ai"
RELATIVE_URLS = False
DELETE_OUTPUT_DIRECTORY = True

# Feeds stay disabled in production too
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
