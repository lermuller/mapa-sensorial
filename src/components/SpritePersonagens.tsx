import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// O sprite vai embutido no HTML: os símbolos dele usam referências internas (<use href="#f-...">),
// que os navegadores não resolvem quando o sprite é um arquivo externo.
const sprite = readFileSync(join(process.cwd(), "src/assets/personagens.svg"), "utf8").replace(
  "<svg ",
  '<svg aria-hidden="true" width="0" height="0" ',
);

export function SpritePersonagens() {
  return <div hidden dangerouslySetInnerHTML={{ __html: sprite }} />;
}
