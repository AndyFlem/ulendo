<script setup>
  import { ref, reactive, inject } from 'vue'

  const axiosPlain = inject('axiosSecure')

  const props = defineProps({
    userId: Number
  })

  const form = ref()
  const dialog = ref(false)

  const state = reactive({
    password1: '',
    password2: '',
    alert: {
      show: false,
      message: null,
      type: null
    }
  })

  async function submit () {
    const { valid } = await form.value.validate()

    if (valid) {
      axiosPlain.put(`/user/${props.userId}/updatepassword`, {password: state.password1})
      .then(() => {
        hide()
      })
      .catch(error => {
        state.alert.show = true
        state.alert.message = error.message
        state.alert.type = 'error'
      })
    }
  }

  function show() {
    dialog.value = true
  }
  function hide() {
    dialog.value = false
    state.alert.show = false
  }
</script>

<template>
  <slot name="activator" :activate="show"></slot>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <v-card>
      <v-card-title class="bg-primary mb-5">
        Reset Password
      </v-card-title>
      <v-card-text>
        <v-alert v-if="state.alert.show" :type="state.alert.type">{{ state.alert.message }}</v-alert>
        <v-form ref="form">
          <v-row>
            <v-col cols="12" >
              <v-text-field
                label="New password*"
                density="compact"
                v-model="state.password1"
                type="password"
                variant="outlined"
                :rules="[v => !!v || 'Password is required']"
              ></v-text-field>
            </v-col>
            <v-col cols="12" >
              <v-text-field
                label="Repeat password*"
                density="compact"
                v-model="state.password2"
                type="password"
                variant="outlined"
                :rules="[(v => !!v || 'Password is required'), (v => (v==state.password1) || 'Passwords must match')]"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          text="Save"
          variant="tonal"
          @click="submit"
        ></v-btn>
        <v-btn
          color="primary"
          text="Cancel"
          variant="tonal"
          @click="hide"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
