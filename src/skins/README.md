# Skins CSS - Guia de Uso

Este diretório contém arquivos CSS para diferentes temas de skins que podem ser injetados no Supabase.

## Arquivos Disponíveis

1. **fire-skin.css** - Tema de Fogo (laranja/vermelho com animações de chama)
2. **ice-skin.css** - Tema de Gelo (azul claro com efeitos de brilho)
3. **neon-skin.css** - Tema Neon Cyberpunk (verde neon com brilho intenso)
4. **rainbow-skin.css** - Tema Arco-íris (cores animadas em gradiente)
5. **gold-skin.css** - Tema Dourado Premium (dourado com brilho)
6. **void-skin.css** - Tema do Vazio (roxo escuro com efeitos de pulso)

## Como Injetar no Supabase

### Opção 1: Usando o campo `sprite_data` (JSONB)

```sql
UPDATE public.skins 
SET sprite_data = jsonb_build_object(
  'css', '<conteúdo do arquivo CSS aqui>',
  'type', 'css'
)
WHERE name = 'fire_skin';
```

### Opção 2: Adicionar campo `css_data` (TEXT)

Se preferir, você pode adicionar um campo específico para CSS:

```sql
ALTER TABLE public.skins 
ADD COLUMN IF NOT EXISTS css_data TEXT;
```

Depois, atualizar:

```sql
UPDATE public.skins 
SET css_data = '<conteúdo do arquivo CSS aqui>'
WHERE name = 'fire_skin';
```

## Estrutura Recomendada no Supabase

Para cada skin, você pode armazenar o CSS de duas formas:

### Forma 1: No campo `sprite_data` (JSONB)
```json
{
  "css": "/* CSS content here */",
  "type": "css",
  "theme": "fire"
}
```

### Forma 2: Campo separado `css_data` (TEXT)
Armazene o CSS diretamente como texto.

## Exemplo de Inserção Completa

```sql
INSERT INTO public.skins (
  name, 
  display_name, 
  description, 
  rarity, 
  unlock_condition,
  sprite_data
) VALUES (
  'fire_skin',
  'Skin de Fogo',
  'Uma skin com tema de fogo e animações',
  'epic',
  'Completar nível 5',
  jsonb_build_object(
    'css', '<conteúdo de fire-skin.css>',
    'type', 'css',
    'theme', 'fire'
  )
);
```

## Aplicação no Jogo

O CSS pode ser aplicado dinamicamente quando uma skin é equipada:

1. Buscar o CSS do campo `sprite_data->>'css'` ou `css_data`
2. Injetar o CSS no `<head>` do documento
3. Aplicar a classe correspondente ao elemento do jogo

## Variáveis CSS Disponíveis

Cada skin define variáveis CSS que podem ser usadas:

- `--player-color`: Cor principal do jogador
- `--player-glow`: Cor do brilho do jogador
- `--boss-color`: Cor do boss
- `--boss-arm-color`: Cor dos braços do boss
- `--boss-weakspot-color`: Cor do ponto fraco
- `--player-bullet-color`: Cor das balas do jogador
- `--boss-bullet-color`: Cor das balas do boss
- `--heart-color`: Cor dos corações
- `--background-color`: Cor de fundo

## Notas

- Os arquivos CSS usam classes como `.skin-fire`, `.skin-ice`, etc.
- As animações são definidas com `@keyframes`
- Os estilos são aplicados via classes CSS no elemento raiz do jogo

