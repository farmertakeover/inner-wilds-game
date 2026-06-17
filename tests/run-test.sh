#!/usr/bin/env nix-shell
#! nix-shell -i bash -p nodejs bun chromium glib nss nspr at-spi2-atk libdrm expat libxkbcommon xorg.libxcb alsa-lib dbus
# Game QA test runner

exec nix-shell --pure -p nodejs bun chromium glib nss nspr at-spi2-atk libdrm expat libxkbcommon xorg.libxcb alsa-lib dbus --run '
  export GSTACK_CHROMIUM_PATH="$(which chromium)"
  export GSTACK_CHROMIUM_NO_SANDBOX=1
  cd /tmp/opencode/nix-test && node test-pw.js
'
