<template>
  <div class="draw-view">
    <v-sheet class="tools-bar glassy-dark px-4" dark>
      <div class="align-center d-flex flex-row">

          <v-icon class="mr-4"> {{ icons.cannabis}} </v-icon>

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
          @change="fileSelected"
          enctype="multipart/form-data"
        />

        <v-btn text @click="toggleFilterMenu()" class="elevation-0">
          <v-icon> {{ icons.filter }} </v-icon>
          <v-icon> {{ filterMenu ? icons.menuUp : icons.menuDown }} </v-icon>
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
          v-model="menuColorPicker"
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

      <v-subheader class="pl-0">
        Filters
      </v-subheader>

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

      <v-subheader class="pl-0">
        Composition
      </v-subheader>
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

    <div
      class="viewport-container"
      @mousemove="move($event)"
      @mousedown="mousedown($event)"
      @mouseup="mouseup($event)"
      @wheel="zoom($event)"
    >
      <div class="ruler">
        <div class="vertical-line"></div>
        <div class="horizontal-line"></div>
      </div>
      <div class="positioner">
        <div class="rotator">
          <canvas id="viewport"></canvas>
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
  };

  public gridColor = "#00FFFF";

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
    /*
    {
      label: "Blur",
      fn: "blur",
      value: 0,
      suffix: "px",
      min: 0,
      max: 50,
      enabled: true,
    },
    */
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
    /*
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
    */
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
  private menuColorPicker = false;

  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private baseImage: HTMLImageElement = new Image();
  private rotation = 0;
  private scale = 1;
  private draging = false;
  private x = 0;
  private y = 0;
  private gridActive = true;
  private gridMenu = false;
  private isFilterActive = true;
  private filterMenu = false;

  mounted(): void {
    this.canvas = document.getElementById("viewport") as HTMLCanvasElement;
    this.context = this.canvas.getContext("2d");
  }

  public fileSelected(evt: any): void {
    evt.preventDefault();
    console.log(evt);
    this.cleanCssVars();
    let file = evt.target.files[0];

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
      this.context.lineWidth = 1;
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

  public zoom(event: any): void {
    let deltaY: number = event.deltaY;
    this.scale = this.scale - deltaY / 500;
    this.scale = this.scale > 0.1 ? this.scale : 0.1;
    this.setCssVar("--scale", this.scale);
  }

  public setPixelSquare(num: number): void {
    this.pixelSquare = Number(this.pixelSquare) + num;
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
  --x: 0;
  --y: 0;
  --ruler-x: 0;
  --ruler-y: 0;
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
    right: 3rem;
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
    cursor: move;

    ._ruler {
      position: absolute;
      left: 0;
      top: 0;
      width: 0;
      height: 0;
      overflow: visible;
      z-index: 2;
      transform: translate(
        calc(var(--ruler-x) * 1px),
        calc(var(--ruler-y) * 1px)
      );
      .horizontal-line,
      .vertical-line {
        position: absolute;
        right: 0;
        bottom: 0;
      }
      .horizontal-line {
        min-width: 100vw;
        border-bottom: 1px solid rgb(0, 255, 255);
      }
      .vertical-line {
        min-height: 100vh;
        border-right: 1px solid rgb(0, 255, 255);
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
      box-shadow: 0 11px 15px -7px rgba(0, 0, 0, 0.2),
        0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0, 0.12) !important;
      min-width: 10%;
      zoom: var(--scale);
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
</style>
