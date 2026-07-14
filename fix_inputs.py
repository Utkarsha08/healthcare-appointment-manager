import os, re
for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            def replace_input(match):
                tag = match.group(0)
                if 'className=' in tag:
                    if 'text-gray-900' not in tag:
                        tag = re.sub(r'className="([^"]+)"', r'className="\1 text-gray-900 placeholder:text-gray-400"', tag)
                return tag

            new_content = re.sub(r'<input[^>]*>', replace_input, content)
            new_content = re.sub(r'<textarea[^>]*>', replace_input, new_content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
