# Iris

My layout for a Keebio Iris Rev. 6.x, configured through VIA.

| File | What it is |
|---|---|
| `iris-layout.json` | VIA layout export. Load it with VIA's **Save + Load → Load**. |
| `iris-layout.svg` | Every layer drawn on the real board: `./iris-layout-to-svg.py iris-layout.json` |
| `iris-wallpaper-dark-3440x1440.png` | The same, as a desktop wallpaper: `./iris-make-wallpaper.sh [--set]` |
| `CHANGELOG.md` | What changed in the layout, and when. |

## Firmware

The board runs `rev6b` firmware: current QMK's `keebio/iris/rev6` target built
with VIA's `via` keymap. It shows up in VIA as **Iris Rev. 6b** (`0xCB10:0x6456`),
with Lighting controls and the `RM_*` RGB matrix keycodes.

Upgraded on 2026-11-22 from Keebio's factory `rev6a` firmware (`0x6356`), which
was too old for the `RM_*` keycodes. Keebio documents the `rev6b` upgrade for
every Rev. 6.x PCB, and the pins, LEDs and encoders match.

### Building

```sh
brew install qmk/qmk/qmk          # also installs avr-gcc and dfu-programmer
git clone https://github.com/qmk/qmk_firmware
git clone https://github.com/the-via/qmk_userspace_via
cd qmk_firmware && git submodule update --init --recursive
qmk config user.qmk_home=$PWD user.overlay_dir=$PWD/../qmk_userspace_via
qmk compile -kb keebio/iris/rev6 -km via   # → keebio_iris_rev6_via.hex
```

Keebio also publishes prebuilt firmware in
[keebio/keebio-firmware](https://github.com/keebio/keebio-firmware), including
`keebio_iris_rev6b_via.hex` and the factory `keebio_iris_rev6a_via.hex` for a
rollback. Their prebuilt `rev6b` predates the `RM_*` keycodes, so build from
QMK to keep the RGB keys working.

### Flashing

Each half has its own ATmega32u4 and is flashed on its own, with the computer's
USB cable plugged into that half. The cable between the halves can stay.

The custom case covers the reset button, so get into the bootloader with a key
instead:

1. In VIA, set an empty key to **Special → Reset** (`QK_BOOT`). Use a key and a
   layer key on the same half, since mid-upgrade the halves run different
   firmware and may not talk to each other. Last time:
   - left half: hold **Num**, top-left key
   - right half: hold **Sym**, top-right key
2. Run the flasher. It waits for the bootloader:

   ```sh
   until dfu-programmer atmega32u4 get bootloader-version >/dev/null 2>&1; do sleep 0.5; done
   dfu-programmer atmega32u4 erase --force
   dfu-programmer atmega32u4 flash --force keebio_iris_rev6_via.hex
   dfu-programmer atmega32u4 reset
   ```

   `qmk flash` does the same, but its bootloader detection gave a false match
   on this Mac and quit without flashing.
3. Press the reset key. The half goes quiet, gets flashed, and comes back.
4. Move the USB cable to the other half and repeat.

Flashing wipes the saved keymap (and the reset keys with it), so load
`iris-layout.json` in VIA afterwards. A new USB ID also means updating `name`
and `vendorProductId` in `iris-layout.json`, or VIA will refuse the import.
