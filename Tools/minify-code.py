import os
import rjsmin
import htmlmin
import rcssmin
from pathlib import Path
parent_folder = "../"
src_folder = os.path.join(parent_folder, "src")

templates = os.path.join(parent_folder, "templates")
js = os.path.join(parent_folder, "js")
css = os.path.join(parent_folder, "css")

def Minify_JS(file_path):
    path, file = os.path.split(file_path)
    script = Path(file_path).read_text()
    Path(os.path.join(js, file)).write_text(rjsmin.jsmin(script))

def Minify_HTML(file_path):
    path, file = os.path.split(file_path)
    script = Path(file_path).read_text()
    Path(os.path.join(templates, file)).write_text(htmlmin.minify(script, remove_comments=True, remove_empty_space=True))

def Minify_CSS(file_path):
    path, file = os.path.split(file_path)
    script = Path(file_path).read_text()
    Path(os.path.join(css, file)).write_text(rcssmin.cssmin(script))

Minify_JS(os.path.join(src_folder, "js/WebsiteHandler.js"))
Minify_HTML(os.path.join(src_folder, "templates/Home.html"))
Minify_CSS(os.path.join(src_folder, "css/style.css"))
