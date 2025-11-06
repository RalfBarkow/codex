{
  description = "nix-shellsmith: Codex CLI + image helper (auto-load OpenAI key)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
    # If this input later errors ("not a flake"), comment it out and rely on npm global install / npx.
    codex.url = "github:openai/codex";
  };

  outputs = { self, nixpkgs, flake-utils, codex }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        # Try to use Codex from its flake; fall back to a placeholder that tells you to npm/brew install.
        codexPkgs =
          if builtins.hasAttr "packages" codex then codex.packages.${system} else {};
        codexPkg =
          if builtins.hasAttr "codex" codexPkgs then codexPkgs.codex
          else if builtins.hasAttr "default" codexPkgs then codexPkgs.default
          else pkgs.stdenvNoCC.mkDerivation {
            pname = "codex-placeholder";
            version = "0";
            phases = [ "installPhase" ];
            installPhase = ''
              mkdir -p $out/bin
              cat > $out/bin/codex <<'EOF'
              #!/usr/bin/env bash
              echo "Codex binary not available from flake input."
              echo "Install with:  npm i -g @openai/codex   or   brew install --cask codex"
              exit 1
              EOF
              chmod +x $out/bin/codex
            '';
          };

        # Helper script: attach one or many images (or a directory of images) + a prompt.
        codexSketch = pkgs.writeShellScriptBin "codex-sketch" ''
          set -euo pipefail
          if [ $# -lt 2 ]; then
            echo "Usage: codex-sketch <image|dir ...> -- <prompt...>" 1>&2
            exit 2
          fi
          # Ensure API key is present (direnv/flake shellHook also tries to load it)
          if [ -z "''${OPENAI_API_KEY-}" ] && [ -f "$HOME/.secrets/open-ai-api-key.txt" ]; then
            export OPENAI_API_KEY="$(tr -d ' \n\r\t' < "$HOME/.secrets/open-ai-api-key.txt")"
          fi
          if [ -z "''${OPEN_API_KEY-}" ] && [ -n "''${OPENAI_API_KEY-}" ]; then
            export OPEN_API_KEY="''${OPENAI_API_KEY}"
          fi

          images=()
          prompt=()
          sep=0
          for arg in "$@"; do
            if [ "$arg" = "--" ]; then sep=1; continue; fi
            if [ $sep -eq 0 ]; then
              if [ -d "$arg" ]; then
                while IFS= read -r f; do
                  images+=("$f")
                done < <(find "$arg" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' -o -iname '*.gif' \) | sort)
              else
                images+=("$arg")
              fi
            else
              prompt+=("$arg")
            fi
          done
          if [ ''${#images[@]} -eq 0 ]; then
            echo "codex-sketch: no images found" 1>&2
            exit 3
          fi
          imglist=$(printf "%s," "''${images[@]}")
          imglist="''${imglist%,}"
          exec codex --image "$imglist" "''${prompt[*]}"
        '';
      in {
        packages.default = codexPkg;
        packages.codex-sketch = codexSketch;

        devShells.default = pkgs.mkShell {
          packages = [
            codexPkg
            codexSketch
            pkgs.nodejs_22
            pkgs.git
            pkgs.imagemagick
            pkgs.jq
            pkgs.ripgrep
            pkgs.fd
          ];
          shellHook = ''
            # Auto-load OpenAI key from per-user secret file if not set
            if [ -z "''${OPENAI_API_KEY-}" ] && [ -f "$HOME/.secrets/open-ai-api-key.txt" ]; then
              export OPENAI_API_KEY="$(tr -d ' \n\r\t' < "$HOME/.secrets/open-ai-api-key.txt")"
            fi
            # Mirror to OPEN_API_KEY if some tools expect that name
            if [ -z "''${OPEN_API_KEY-}" ] && [ -n "''${OPENAI_API_KEY-}" ]; then
              export OPEN_API_KEY="''${OPENAI_API_KEY}"
            fi

            if [ -n "''${OPENAI_API_KEY-}" ]; then
              echo "▶ OPENAI_API_KEY loaded from ~/.secrets/open-ai-api-key.txt"
            else
              echo "▶ No OPENAI_API_KEY found. You can:"
              echo "   - Put your key in ~/.secrets/open-ai-api-key.txt (preferred), or"
              echo "   - export OPENAI_API_KEY in .env, or"
              echo "   - run: codex login"
            fi

            echo "▶ Try: codex-sketch ./screens -- \"Refactor per sketch\""
          '';
        };
      });
}
