<script setup>
  import { inject, watch } from 'vue'
  import AppBar from './components/AppBar.vue'
  import { RouterView } from 'vue-router'

  const user = inject('user')

  watch(
    () => user.user_id,
    () => {
      console.log('user changed', JSON.stringify(user))
    },
    { immediate: true }
  )


</script>

<template>
  <v-app>
    <v-main>
      <AppBar />

      <RouterView />

    </v-main>
  </v-app>

</template>
<style>
  figcaption {
    padding: 10px 10px 5px 10px;
    font-family: 'Courier New', Courier, monospace;

    color: #6f6f6f;
  }
  </style>
