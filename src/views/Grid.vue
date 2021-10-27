<template>
  <div class="draw-view">
    <v-sheet class="tools-bar elevation-8">
      <v-btn @click="$refs.fileInput.click()">
        <v-icon> {{ icons.upload }} </v-icon>
      </v-btn>
      <v-menu
        v-model="menuColorPicker"
        :close-on-content-click="false"
        offset-x
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on">
            <v-avatar :color="gridColor" size="24"></v-avatar>
          </v-btn>
        </template>

        <v-card>
          <v-color-picker
            :swatches="swatches"
            mode="hexa"
            show-swatches
            v-model="gridColor"
            @input="drawGrid()"
          ></v-color-picker>
        </v-card>
      </v-menu>
      <v-btn @click="drawGrid()">
        <v-icon> {{ icons.grid }} </v-icon>
      </v-btn>

      <v-btn @click="pixelSquare > 0 ? pixelSquare -= 10 : ''">
        <v-icon> {{ icons.minus}} </v-icon>
      </v-btn>
      <input @change="drawGrid()" class="minimal" type="number" v-model="pixelSquare">
      <v-btn @click="pixelSquare += 10">
        <v-icon> {{ icons.plus }} </v-icon>
      </v-btn>

      <input
        style="display: none"
        ref="fileInput"
        type="file"
        @change="fileSelected"
        enctype="multipart/form-data"
      />

    </v-sheet>
    <v-sheet class="tools-bar-right elevation-8">
      <v-btn @click="rotate()">
        <v-icon> {{ icons.right }} </v-icon>
      </v-btn>
      <v-btn @click="rotate(false)">
        <v-icon> {{ icons.left }} </v-icon>
      </v-btn>
      <v-btn @click="download()">
        <v-icon> {{ icons.download }} </v-icon>
      </v-btn>

      <input
        style="display: none"
        ref="fileInput"
        type="file"
        @change="fileSelected"
        enctype="multipart/form-data"
      />
    </v-sheet>
    <div
      class="viewport-container"
      @mousemove.stop="move($event)"
      @mousedown="mousedown($event)"
      @mouseup="mouseup($event)"
      @wheel.prevent="zoom($event)"
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
import { Component, Vue } from "vue-property-decorator";

import {
  mdiDownload,
  mdiFileUpload,
  mdiGridLarge,
  mdiMinus,
  mdiPlus,
  mdiRotateLeftVariant,
  mdiRotateRightVariant,
} from "@mdi/js";

@Component
export default class Grid extends Vue {
  public menuColorPicker = false;

  public icons = {
    upload: mdiFileUpload,
    grid: mdiGridLarge,
    left: mdiRotateLeftVariant,
    right: mdiRotateRightVariant,
    download: mdiDownload,
    minus: mdiMinus,
    plus: mdiPlus

  };

  public gridColor = "#FF0000";

  public swatches: Array<Array<string>> = [
    ["#FF0000", "#AA0000", "#550000"],
    ["#FFFF00", "#AAAA00", "#555500"],
    ["#00FF00", "#00AA00", "#005500"],
    ["#00FFFF", "#00AAAA", "#005555"],
    ["#0000FF", "#0000AA", "#000055"],
  ];

  private canvas: any = null;
  private context: any = null;
  public pixelSquare = 100;
  private baseImage: HTMLImageElement = new Image();
  private rotation = 0;
  private scale = 1;
  private draging = false;
  private x = 0;
  private y = 0;

  mounted(): void {
    this.canvas = document.getElementById("viewport");
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
        this.drawImageOnCanvas();
      };
    });
    reader.readAsDataURL(file);
  }

  private drawImageOnCanvas(): void {
    if (this.canvas && this.context) {
      this.canvas.width = this.baseImage.width;
      this.canvas.height = this.baseImage.height;
      this.context.drawImage(this.baseImage, 0, 0);
    }
  }

  public cleanImage(): void {
    this.drawImageOnCanvas();
  }

  private cleanCssVars(): void{
    this.setCssVar("--x", 0);
    this.setCssVar("--y", 0);
    this.setCssVar("--ruler-x", 0);
    this.setCssVar("--ruler-y", 0);
    this.setCssVar("--scale", 1);
  }

  public drawGrid(): void {
    if (this.context) {
      this.cleanImage();
      let h = this.canvas.height;
      let w = this.canvas.width;
      let step = this.pixelSquare;
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
    var link = document.createElement("a");
    link.download = "image.png";
    link.href = this.canvas.toDataURL();
    link.click();
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

  public move(event: any): void {
    if(event.currentTarget.classList.contains("viewport-container")){
      this.setCssVar("--ruler-x", event.layerX);
      this.setCssVar("--ruler-y", event.layerY);
      if(this.draging){
        this.x = this.x + event.movementX;
        this.y = this.y + event.movementY;
        this.setCssVar("--x", this.x);
        this.setCssVar("--y", this.y);
      }
    }
  }
  public mousedown(event : any) : void{
    this.draging = true;
  }
  public mouseup(event : any) : void{
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
  position: relative;
  background: grey;
  max-height: calc(100vh - 70px);
  max-width: 100%;

  input.minimal{
    font-size: 1.2rem;
    text-align:center;
    padding: 4px 1rem;
    width: 6rem;
  }

  .tools-bar {
    position: absolute;
    left: 3rem;
    top: 1rem;
    z-index: 10;
  }
  .tools-bar-right {
    position: absolute;
    right: 3rem;
    top: 1rem;
    z-index: 10;
  }
  .viewport-container {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
    .ruler {
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
        border-bottom: 1px solid red;
      }
      .vertical-line {
        min-height: 100vh;
        border-right: 1px solid red;
      }
    }
    .rotator{
      transform-origin: 50% 50%;
      transition: rotate 0.3s ease-in;
      transform: rotate(calc(1deg * var(--rotation)));
      box-shadow: 0px 0px 2px red;
      width: fit-content;
    }
    .positioner{
      transform: translate(calc(var(--x) * 1px), calc(var(--y) * 1px));
      box-shadow: 0px 0px 2px blue;
    }
    #viewport {
      box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);
      width: calc(100% * var(--scale));
      height: 90%;
      //transform-origin: calc(50vw + var(--ruler-x)*1px) calc(50vh + var(--ruler-y) * 1px);
      transition: all 0.1s ease;
      //transform: scale(var(--scale));
      box-shadow: inset 0px 0px 20px green;
    }
  }
}
</style>
