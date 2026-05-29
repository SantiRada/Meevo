# -*- coding: utf-8 -*-

# 1. Update types.ts
with open('src/services/storage/types.ts', 'r', encoding='utf-8') as f:
    t = f.read()

t = t.replace(
    "color?: string;\n      layers?: LayerData[];\n    };",
    "color?: string;\n      borderRadius?: number;\n      layers?: LayerData[];\n    };"
)

with open('src/services/storage/types.ts', 'w', encoding='utf-8') as f:
    f.write(t)

print("types.ts updated")
