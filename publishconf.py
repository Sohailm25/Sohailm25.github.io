import os
import sys

sys.path.append(os.curdir)
from pelicanconf import *

SITEURL = "https://sohailmo.ai"
RELATIVE_URLS = False
DELETE_OUTPUT_DIRECTORY = True

# Site discovery surfaces
FEED_ALL_ATOM = "feed.xml"
CATEGORY_FEED_ATOM = None
