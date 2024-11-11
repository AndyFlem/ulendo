<script setup>
  import { computed } from 'vue'

  import { useDisplay } from 'vuetify'

  const { mdAndUp, smAndUp } = useDisplay()

  const mainBorder = computed(() => {
    if (mdAndUp.value) return 'padding-left:200px; padding-right:200px;'
    if (smAndUp.value) return 'padding-left:100px; padding-right:100px;'
    return ''
  })

</script>

<template>
<v-container fluid class="text-body-2" :style="mainBorder">
  <slot />
</v-container>

</template>

