import re

with open('view-configs.js') as input:
    line = input.readline()
    while line:
        export_match = re.match(r'export const (\w+) = ', line)
        if export_match:
            line = '{\n'
            with open('view-configs-new/{}.json'.format(export_match[1]), 'w') as output:
                while not re.match(r'^\}', line):
                    line = re.sub(r'^(\s+)(\w+):', r'\1"\2":', line)
                    line = re.sub("'", '"', line)
                    output.write(line)
                    line = input.readline()
                output.write('}\n')
        line = input.readline()
