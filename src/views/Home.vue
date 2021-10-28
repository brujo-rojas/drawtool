<template>
  <div>
    <h2 class="pa-4 text-center">Draw Tools</h2>
    <v-container class="grey lighten-5">
      <v-row no-gutters>
        <v-col cols="12" sm="4">
          <v-card color="purple" dark @click="goTo('grid')">
            <v-card-title class="text-h5"> GRID </v-card-title>

            <v-card-subtitle> Dibujado de grilla sobre imagen </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Grid extends Vue {
  public goTo(routeName: string): void {
    this.$router.push({ name: routeName });
  }
}
</script>
