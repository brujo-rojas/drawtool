<template>
  <div class="draw-view" @drop.prevent="addFile" @dragover.prevent>
    <v-sheet class="tools-bar glassy-dark px-4" dark>
      <div class="align-center d-flex flex-row">
        <v-icon class="mr-4"> {{ icons.cannabis }} </v-icon>

        <v-btn text @click="$refs.fileInput.click()" class="elevation-0">
          <v-icon> {{ icons.upload }} </v-icon>
        </v-btn>
        <v-btn text @click="rotate()" class="elevation-0">
          <v-icon> {{ icons.right }} </v-icon>
        </v-btn>
        <v-btn text @click="rotate(false)" class="elevation-0">
          <v-icon> {{ icons.left }} </v-icon>
        </v-btn>

        <v-btn text @click="toggleGridMenu()" class="elevation-0">
          <v-icon :color="gridColor"> {{ icons.grid }} </v-icon>
          <v-icon> {{ gridMenu ? icons.menuUp : icons.menuDown }} </v-icon>
        </v-btn>

        <v-spacer></v-spacer>

        <input
          style="display: none"
          ref="fileInput"
          type="file"
          @change="chooseFile"
          enctype="multipart/form-data"
        />

        <v-btn text @click="toggleFilterMenu()" class="elevation-0">
          <v-icon> {{ icons.filter }} </v-icon>
          <v-icon> {{ filterMenu ? icons.menuUp : icons.menuDown }} </v-icon>
        </v-btn>

        <v-btn text @click="togglePickerColor()" class="elevation-0">
          <v-icon> {{ icons.picker }} </v-icon>
        </v-btn>

        <v-btn text @click="download()" class="elevation-0">
          <v-icon> {{ icons.download }} </v-icon>
        </v-btn>
      </div>
    </v-sheet>

    <v-sheet
      v-if="gridMenu"
      class="pa-2 glassy-dark position-top-left d-flex flex-column"
      dark
      rounded
    >
      <div class="d-flex flex-row">
        <v-btn text @click="toggleGrid()" class="elevation-0">
          <v-icon> {{ gridActive ? icons.eyeOpen : icons.eyeClose }} </v-icon>
        </v-btn>

        <v-divider vertical></v-divider>

        <v-menu
          v-model="menuColorGrid"
          :close-on-content-click="false"
          offset-x
        >
          <template v-slot:activator="{ on, attrs }">
            <v-btn text v-bind="attrs" v-on="on" class="elevation-0">
              <v-avatar :color="gridColor" size="24"></v-avatar>
            </v-btn>
          </template>

          <v-card>
            <v-color-picker
              :swatches="swatches"
              mode="hexa"
              show-swatches
              v-model="gridColor"
              @input="redraw()"
            ></v-color-picker>
          </v-card>
        </v-menu>

        <v-divider vertical></v-divider>

        <div class="flex flex-column">
          <div class="flex flex-row">
            <v-btn text @click="setLineWidth(-1)" class="elevation-0">
              <v-icon> {{ icons.minus }} </v-icon>
            </v-btn>

            <input
              @change="redraw()"
              class="minimal"
              type="number"
              v-model="lineWidth"
            />

            <v-btn text @click="setLineWidth(1)" class="elevation-0">
              <v-icon> {{ icons.plus }} </v-icon>
            </v-btn>
          </div>
          <div class="flex flex-row">
            <v-btn text @click="setPixelSquare(-10)" class="elevation-0">
              <v-icon> {{ icons.minus }} </v-icon>
            </v-btn>

            <input
              @change="redraw()"
              class="minimal"
              type="number"
              v-model="pixelSquare"
            />

            <v-btn text @click="setPixelSquare(10)" class="elevation-0">
              <v-icon> {{ icons.plus }} </v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <div class="d-flex flex-row">
        <v-spacer></v-spacer>
        <span class="mx-2"> {{ squareWidth }} x {{ squareHeight }}</span>
      </div>
    </v-sheet>

    <v-sheet
      v-if="filterMenu"
      class="pa-2 slider-container glassy-dark position-top-right"
      dark
      rounded
    >
      <v-btn text @click="toggleFilter()" class="elevation-0">
        <v-icon> {{ isFilterActive ? icons.eyeOpen : icons.eyeClose }} </v-icon>
      </v-btn>

      <v-subheader class="pl-0"> Filters </v-subheader>

      <div
        class="d-flex flex-row align-center"
        v-for="(filter, indexFilter) in filters"
        :key="'filter-' + indexFilter"
      >
        <v-simple-checkbox
          v-ripple
          @input="changeSlider()"
          color="green"
          v-model="filter.enabled"
        ></v-simple-checkbox>
        <v-slider
          dense
          hide-details
          v-model="filter.value"
          @input="changeSlider()"
          color="green"
          :min="filter.min"
          :max="filter.max"
          step="1"
          :thumb-size="24"
          thumb-label
          :label="filter.label"
        ></v-slider>
      </div>

      <v-subheader class="pl-0"> Composition </v-subheader>
      <div
        class="d-flex flex-row align-center"
        v-for="(composition, indexComposition) in compositions"
        :key="indexComposition"
      >
        <v-simple-checkbox
          v-ripple
          @input="changeSlider()"
          color="blue"
          v-model="composition.enabled"
        ></v-simple-checkbox>

        <v-slider
          dense
          hide-details
          v-model="composition.value"
          @input="changeSlider()"
          color="blue"
          :min="composition.min"
          :max="composition.max"
          step="1"
          :thumb-size="24"
          thumb-label
          :label="composition.label"
        ></v-slider>
      </div>
    </v-sheet>

    <v-sheet
      v-if="isShowColorPicker"
      class="pa-2 color-picker-container glassy-dark position-bottom-right"
      dark
      rounded
    >
      <div>
        <div
          class="mini-bar"
          :style="`--porcentaje: ${actualColor.rgbaPercentage.r}%;`"
          style="--bg: red"
          :label="actualColor.rgbaPercentage.r"
        ></div>
        <div
          class="mini-bar"
          :style="`--porcentaje: ${actualColor.rgbaPercentage.g}%;`"
          style="--bg: green"
          :label="actualColor.rgbaPercentage.g"
        ></div>
        <div
          class="mini-bar"
          :style="`--porcentaje: ${actualColor.rgbaPercentage.b}%;`"
          style="--bg: blue"
          :label="actualColor.rgbaPercentage.b"
        ></div>

        <div class="mini-bar-divider"></div>
        <div
          class="mini-bar"
          :style="`--porcentaje: ${actualColor.cmyk.c}%;`"
          style="--bg: cyan"
          :label="actualColor.cmyk.c"
        ></div>
        <div
          class="mini-bar"
          :style="`--porcentaje: ${actualColor.cmyk.m}%;`"
          style="--bg: magenta"
          :label="actualColor.cmyk.m"
        ></div>
        <div
          class="mini-bar"
          :style="`--porcentaje: ${actualColor.cmyk.y}%;`"
          style="--bg: yellow"
          :label="actualColor.cmyk.y"
        ></div>
        <div
          class="mini-bar"
          :style="`--porcentaje: ${actualColor.cmyk.k}%;`"
          style="--bg: black"
          :label="actualColor.cmyk.k"
        ></div>
      </div>
      <div class="color-frame"></div>
    </v-sheet>

    <div
      class="viewport-container"
      @wheel="zoom($event)"
      @mousemove="move($event)"
      @mousedown.left="mousedown($event)"
      @mouseup.left="mouseup($event)"
      @mouseout.left="mouseup($event)"
    >
      <div class="ruler">
        <div class="vertical-line"></div>
        <div class="horizontal-line"></div>
      </div>
      <div class="positioner">
        <div class="rotator">
          <canvas @mousemove="moveOnCanvas($event)" id="viewport"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { debounce } from "../helpers/helpers";

import {
  mdiDownload,
  mdiEye,
  mdiEyeOff,
  mdiUpload,
  mdiGridLarge,
  mdiImageFilterBlackWhite,
  mdiMinus,
  mdiPlus,
  mdiRotateLeftVariant,
  mdiRotateRightVariant,
  mdiMenuUp,
  mdiMenuDown,
  mdiCannabis,
  mdiEyedropper,
} from "@mdi/js";

@Component
export default class Grid extends Vue {
  public icons = {
    cannabis: mdiCannabis,
    upload: mdiUpload,
    grid: mdiGridLarge,
    left: mdiRotateLeftVariant,
    right: mdiRotateRightVariant,
    download: mdiDownload,
    minus: mdiMinus,
    plus: mdiPlus,
    filter: mdiImageFilterBlackWhite,
    eyeOpen: mdiEye,
    eyeClose: mdiEyeOff,
    menuDown: mdiMenuDown,
    menuUp: mdiMenuUp,
    picker: mdiEyedropper,
  };

  public gridColor = "#00FFFF";
  public lineWidth = 1;

  public swatches: Array<Array<string>> = [
    ["#FF0000", "#AA0000", "#550000"],
    ["#FFFF00", "#AAAA00", "#555500"],
    ["#00FF00", "#00AA00", "#005500"],
    ["#00FFFF", "#00AAAA", "#005555"],
    ["#0000FF", "#0000AA", "#000055"],
  ];

  public filters: Array<any> = [
    {
      label: "Contrast",
      fn: "contrast",
      value: 100,
      suffix: "%",
      min: 0,
      max: 200,
      enabled: true,
    },
    {
      label: "Blur",
      fn: "blur",
      value: 0,
      suffix: "px",
      min: 0,
      max: 50,
      enabled: true,
    },
    {
      label: "Sepia",
      fn: "sepia",
      value: 0,
      suffix: "%",
      min: 0,
      max: 100,
      enabled: true,
    },
    {
      label: "Saturate",
      fn: "saturate",
      value: 100,
      suffix: "%",
      min: 0,
      max: 200,
      enabled: true,
    },
    {
      label: "Invert",
      fn: "invert",
      value: 0,
      suffix: "%",
      min: 0,
      max: 100,
      enabled: true,
    },
    {
      label: "Grayscale",
      fn: "grayscale",
      value: 0,
      suffix: "%",
      min: 0,
      max: 100,
      enabled: true,
    },
    {
      label: "Brightness",
      fn: "brightness",
      value: 100,
      suffix: "%",
      min: 0,
      max: 200,
      enabled: true,
    },
  ];

  public compositions: Array<any> = [
    /*
    {
      label: "Multiply",
      operation: "multiply",
      value: 0,
      enabled: true,
    },
    {
      label: "Saturation",
      operation: "saturation",
      value: 0,
      enabled: true,
    },
    {
      label: "Lighten",
      operation: "lighten",
      value: 0,
      enabled: true,
      min: 0,
      max: 100,
    },
    */
    {
      label: "Lighter",
      operation: "lighter",
      value: 0,
      enabled: true,
      min: 0,
      max: 100,
    },
    {
      label: "Darken",
      operation: "darken",
      value: 0,
      enabled: true,
      min: -100,
      max: 0,
    },
    /*
    {
      label: "Hard Light",
      operation: "hard-light",
      value: 0,
      enabled: true,
    },
    */
    {
      label: "Soft Light",
      operation: "soft-light",
      value: 0,
      enabled: true,
      min: 0,
      max: 100,
    },
    {
      label: "Luminosity",
      operation: "luminosity",
      value: 0,
      enabled: true,
      min: 0,
      max: 100,
    },
  ];

  private pixelSquare = 100;
  private squareWidth = 0;
  private squareHeight = 0;
  private menuColorGrid = false;
  private isShowColorPicker = false;
  private actualColor = this.canvasPixelColor(null); //init defaults

  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private baseImage: HTMLImageElement = new Image();
  private rotation = 0;
  private scale = 1;
  private draging = false;
  private x = 0;
  private y = 0;
  private gridActive = false;
  private gridMenu = false;
  private isFilterActive = true;
  private filterMenu = false;

  mounted(): void {
    this.canvas = document.getElementById("viewport") as HTMLCanvasElement;
    this.context = this.canvas.getContext("2d");
  }

  public addFile(evt: any): void {
    let droppedFiles = evt.dataTransfer.files;
    if (!droppedFiles) return;
    this.fileSelected(droppedFiles[0]);
  }

  public chooseFile(evt: any): void {
    evt.preventDefault();
    let file = evt.target.files[0];
    if (!file) return;
    this.fileSelected(file);
  }

  public fileSelected(file: any): void {
    this.cleanCssVars();

    if (file.type && !file.type.startsWith("image/")) {
      console.log("File is not an image.", file.type, file);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", (event: any) => {
      this.baseImage.src = event.target.result;
      this.baseImage.onload = () => {
        this.redraw();
      };
    });
    reader.readAsDataURL(file);
  }
  public cleanImage(): void {
    this.drawImageOnCanvas();
  }

  private refreshProportions(): void {
    this.squareWidth =
      Math.round((this.baseImage.width * 10) / this.pixelSquare) / 10;
    this.squareHeight =
      Math.round((this.baseImage.height * 10) / this.pixelSquare) / 10;
  }

  private cleanCssVars(): void {
    this.x = 0;
    this.y = 0;
    this.scale = 1;
    this.setCssVar("--x", 0);
    this.setCssVar("--y", 0);
    this.setCssVar("--ruler-x", 0);
    this.setCssVar("--ruler-y", 0);
    this.setCssVar("--scale", 1);
  }

  public toggleGridMenu(): void {
    this.gridMenu = !this.gridMenu;
  }

  public toggleGrid(): void {
    this.gridActive = !this.gridActive;
    this.redraw();
  }

  public toggleFilterMenu(): void {
    this.filterMenu = !this.filterMenu;
  }

  public toggleFilter(): void {
    this.isFilterActive = !this.isFilterActive;
    this.redraw();
  }

  public togglePickerColor(): void {
    this.isShowColorPicker = !this.isShowColorPicker;
  }

  public changeSlider = debounce(() => {
    this.redraw();
  }, 10);

  public redraw(): void {
    this.drawImageOnCanvas();
    this.drawGrid();
  }

  private drawImageOnCanvas(): void {
    if (this.canvas && this.context) {
      this.canvas.width = this.baseImage.width;
      this.canvas.height = this.baseImage.height;

      if (this.isFilterActive) {
        this.filterImage(this.context, this.filters);
      }

      this.context.drawImage(this.baseImage, 0, 0);

      if (this.isFilterActive) {
        this.compositeImage(this.context, this.compositions);
      }
    }
  }

  public filterImage(context: any, filters: Array<any>): void {
    let filtersString = "";
    filters.forEach((filter) => {
      if (filter.enabled) {
        filtersString += `${filter.fn}(${filter.value}${filter.suffix}) `;
      }
    });
    context.filter = filtersString;
  }

  public compositeImage(context: any, compositions: Array<any>): void {
    if (this.context) {
      this.context.filter = "none";
      compositions.forEach((composition) => {
        if (composition.enabled) {
          context.globalCompositeOperation = composition.operation;
          context.fillStyle = composition.value > 0 ? "white" : "black";
          context.globalAlpha = Math.abs(composition.value / 100);
          context.fillRect(0, 0, this.baseImage.width, this.baseImage.height);
        }
      });
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
    }
  }

  public drawGrid(): void {
    if (this.canvas && this.context && this.gridActive) {
      this.context.globalCompositeOperation = "source-over";
      this.context.globalAlpha = 1;
      this.context.filter = "none";
      this.refreshProportions();
      let h = this.canvas.height;
      let w = this.canvas.width;
      let step = Number(this.pixelSquare);
      this.context.beginPath();
      for (var x = 0; x <= w; x += step) {
        this.context.moveTo(x, 0);
        this.context.lineTo(x, h);
      }
      for (var y = 0; y <= h; y += step) {
        this.context.moveTo(0, y);
        this.context.lineTo(w, y);
      }
      this.context.strokeStyle = this.gridColor;
      this.context.lineWidth = this.lineWidth || 1;
      this.context.stroke();
    }
  }

  public download(): void {
    if (this.canvas) {
      var link = document.createElement("a");
      link.download = "image.png";
      link.href = this.canvas.toDataURL();
      link.click();
    }
  }

  public rotate(toRight = true): void {
    this.rotation += 90 * (toRight ? 1 : -1);
    this.setCssVar("--rotation", this.rotation);
  }

  private setCssVar(varName: string, value: any = ""): void {
    document.documentElement.style.setProperty(varName, value);
  }

  private getCssVar(varName: string): any {
    return getComputedStyle(document.documentElement).getPropertyValue(varName);
  }

  public zoom(event: any): void {
    if (this.canvas) {
      let deltaY: number = event.deltaY;
      this.scale = this.scale - deltaY / 500;
      this.scale = this.scale > 0.1 ? this.scale : 0.1;

      let mX = event.offsetX || event.layerX;
      let mY = event.offsetY || event.layerY;
      let x = (mX * this.canvas.width) / this.canvas.clientWidth;
      let y = (mY * this.canvas.height) / this.canvas.clientHeight;

      x = (x / this.canvas.clientWidth) * 100;
      y = (y / this.canvas.clientWidth) * 100;

      x = x > 100 ? 100 : x;
      y = y > 100 ? 100 : y;

      x = x < 0 ? 0 : x;
      y = y < 0 ? 0 : y;

      this.setCssVar("--scale", this.scale);
      //this.setCssVar("--scale-origin-x", x);
      //this.setCssVar("--scale-origin-y", y);
    }
  }

  public setPixelSquare(num: number): void {
    this.pixelSquare = Number(this.pixelSquare) + num;
    this.redraw();
  }

  public setLineWidth(num: number): void {
    this.lineWidth = Number(this.lineWidth) + num;
    this.redraw();
  }

  public move(event: any): void {
    if (event.currentTarget.classList.contains("viewport-container")) {
      this.setCssVar("--ruler-x", event.pageX);
      this.setCssVar("--ruler-y", event.pageY);
      if (this.draging) {
        this.x = this.x + event.movementX;
        this.y = this.y + event.movementY;
        this.setCssVar("--x", this.x);
        this.setCssVar("--y", this.y);
      }
    }
  }
  public moveOnCanvas(event: any): void {
    if (event.currentTarget.id == "viewport") {
      if (this.isShowColorPicker) {
        this.actualColor = this.canvasPixelColor(event);
        this.setCssVar("--color-frame-bg", this.actualColor.hex);
      }
    }
  }

  public canvasPixelColor(ev: any) {
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;

    if (ev && this.canvas && this.context) {
      let mX = ev.offsetX || ev.layerX;
      let mY = ev.offsetY || ev.layerY;
      const x = (mX * this.canvas.width) / this.canvas.clientWidth;
      const y = (mY * this.canvas.height) / this.canvas.clientHeight;
      let data = this.context.getImageData(x, y, 1, 1).data;
      r = data[0];
      g = data[1];
      b = data[2];
      a = data[3];
    }
    return {
      rgbaPercentage: {
        r: Math.round((r / 255) * 100),
        g: Math.round((g / 255) * 100),
        b: Math.round((b / 255) * 100),
        a: Math.round((a / 255) * 100),
      },
      rgba: {
        r,
        g,
        b,
        a,
      },
      hex: this.rgbToHex(r, g, b),
      cmyk: this.rgb2cmyk(r, g, b),
    };
  }
  public rgb2cmyk(r: number, g: number, b: number, normalized = false) {
    var c = 1 - r / 255;
    var m = 1 - g / 255;
    var y = 1 - b / 255;
    var k = Math.min(c, Math.min(m, y));

    c = (c - k) / (1 - k);
    m = (m - k) / (1 - k);
    y = (y - k) / (1 - k);

    if (!normalized) {
      c = Math.round(c * 100);
      m = Math.round(m * 100);
      y = Math.round(y * 100);
      k = Math.round(k * 100);
    }

    c = isNaN(c) ? 0 : c;
    m = isNaN(m) ? 0 : m;
    y = isNaN(y) ? 0 : y;
    k = isNaN(k) ? 0 : k;

    return {
      c: c,
      m: m,
      y: y,
      k: k,
    };
  }
  public rgbToHex(r: number, g: number, b: number) {
    return "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1);
  }

  public mousedown(event: any): void {
    this.draging = true;
  }

  public mouseup(event: any): void {
    this.draging = false;
  }
}
</script>
<style lang="scss">
:root {
  --rotation: 0;
  --scale: 1;
  --scale-origin-x: 50%;
  --scale-origin-y: 50%;
  --x: 0;
  --y: 0;
  --ruler-x: 0;
  --ruler-y: 0;
  --color-frame-bg: black;
}

.draw-view {
  width: 100%;
  height: 100%;
  background: rgb(66, 66, 66);
  max-height: 100vh;
  max-width: 100%;
  position: relative;

  input.minimal {
    font-size: 1rem;
    text-align: center;
    padding: 0;
    width: 6rem;
    color: inherit;
  }

  .slider-container {
    width: 400px;
  }

  .tools-bar {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 100%;
    z-index: 10;
    height: 2.5em;
  }

  .position-bottom-right {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    z-index: 10;
  }

  .position-top-right {
    position: absolute;
    right: 1rem;
    top: 2.5rem;
    z-index: 10;
  }

  .position-top-left {
    position: absolute;
    left: 1rem;
    top: 2.5rem;
    z-index: 10;
  }
  .viewport-container {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: none;

    .ruler {
      position: absolute;
      left: 0;
      top: 0;
      width: 0;
      height: 0;
      overflow: visible;
      z-index: 2;
      pointer-events: none;

      transform: translate(
        calc(var(--ruler-x) * 1px),
        calc(var(--ruler-y) * 1px)
      );

      &:after,
      &:before {
        content: "";
        display: block;
        position: absolute;
        left: -10px;
        top: -10px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        //border: 1px solid red;
        backdrop-filter: invert(100%);
      }

      &:before {
        left: -8px;
        top: -8px;
        width: 16px;
        height: 16px;
      }

      .horizontal-line,
      .vertical-line {
        position: absolute;
      }
      .horizontal-line {
        width: 30px;
        right: -15px;
        height: 2px;
        margin-top: -1px;
        backdrop-filter: invert(100%);
      }
      .vertical-line {
        height: 30px;
        bottom: -15px;
        width: 2px;
        margin-left: -1px;
        backdrop-filter: invert(100%);
      }
    }
    .rotator {
      transform-origin: 50% 50%;
      transition: all 0.1s ease-in-out;
      transform: rotate(calc(1deg * var(--rotation)));
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .positioner {
      transform: translate(calc(var(--x) * 1px), calc(var(--y) * 1px));
    }
    #viewport {
      position: relative;
      box-shadow: 0 11px 15px -7px rgba(0, 0, 0, 0.2),
        0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0, 0.12) !important;
      min-width: 10%;
      transform: scale(var(--scale));
      transform-origin: calc(var(--scale-origin-x) * 1%)
        calc(var(--scale-origin-y) * 1%);
      height: 90%;
      background: rgba(168, 168, 168, 1);
    }
  }
}
.v-btn.upload-btn {
  margin: 1em;
  bottom: 0px;
  right: 0px;
  position: absolute !important;
  z-index: 20;
}

.glassy-dark {
  color: white;
  background: rgba(0, 0, 0, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: inset 0px 0px 40px rgba(255, 255, 255, 0.15),
    5px 10px 10px rgba(0, 0, 0, 0.2) !important;
  backdrop-filter: blur(20px);
}
.color-frame {
  background: var(--color-frame-bg);
  width: 100%;
  min-width: 100px;
  height: 70px;
}

.mini-bar-divider {
  height: 110px;
  margin: 0 10px;
  width: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  display: inline-block;
}

.mini-bar {
  width: 6px;
  height: 70px;
  display: inline-block;
  position: relative;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  margin: 30px 10px 5px;
  &:after {
    content: "";
    height: var(--porcentaje);
    width: inherit;
    background: var(--bg);
    position: absolute;
    left: 0px;
    bottom: 0px;
    display: block;
    border-radius: inherit;
    border-top: 2px solid grey;
  }
  &:before {
    content: "__";
    content: attr(label);
    text-shadow: 0px 0px 2px black;
    color: white;
    height: auto;
    width: auto;
    background: rgba(0, 0, 0, 0.4);
    position: absolute;
    left: -6px;
    top: -25px;
    padding: 3px;
    display: block;
    text-align: center;
    font-size: 12px;
    z-index: 2;
    box-sizing: border-box;
    border-radius: 3px;
  }
}
</style>
