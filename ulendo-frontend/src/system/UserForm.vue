<script setup>
  import { ref, reactive, inject } from 'vue'

  const axiosPlain = inject('axiosSecure')
  const emit = defineEmits(['userCreated', 'userUpdated'])

  const props = defineProps({
    userId: Number
  })

  const form = ref()
  const dialog = ref(false)

  const blankUser = {
    user_id: null,
    first_name: null,
    last_name: null,
    email: null,
    password: null,
    organisation: null,
    can_login: false,
  }

  const state = reactive({
    user: {...blankUser},
    groups: null,
    alert: {
      show: false,
      message: null,
      type: null
    }
  })

  async function submit () {
    const { valid } = await form.value.validate()

    if (valid) {
      state.user.groups = state.groups.filter(group => group.checked)
      if (props.userId) {
        axiosPlain.put(`/user/${props.userId}`, state.user)
        .then(() => {
          state.user.user_name = state.user.first_name + ' ' + state.user.last_name
          emit('userUpdated', state.user)
          hide()
        })
        .catch(error => {
          state.alert.show = true
          state.alert.message = error.message
          state.alert.type = 'error'
        })
      } else {
        axiosPlain.post('/user', state.user)
          .then(response => {
            console.log(response.data)
            state.userId = response.data.user_id
            state.user.user_id = response.data.user_id
            state.user.user_name = state.user.first_name + ' ' + state.user.last_name
            emit('userCreated', state.user)
            hide()
          })
          .catch(error => {
            state.alert.show = true
            state.alert.message = error.message
            state.alert.type = 'error'
          })
      }
    }
  }
  function show() {
    if (props.userId) {
      axiosPlain.get('/user/' + props.userId)
        .then(row => {
          state.user = row.data
          return axiosPlain.get('/groups')
        })
        .then(row => {
          row.data.forEach(group => {
            group.checked = state.user.groups.includes(group.usergroup_ref)
          })
          state.groups = row.data
        })
    } else {
      axiosPlain.get('/groups')
      .then(row => {
        state.groups = row.data
      })
    }
    dialog.value = true
  }
  function hide() {
    dialog.value = false
    state.alert.show = false
    state.user = {...blankUser}
  }
</script>

<template>
  <slot name="activator" :activate="show"></slot>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <v-skeleton-loader
      v-if="(props.userId && !state.user.user_id)"
      class="mx-auto"
      max-width="600px"
      width="100%"
      type="card, actions"
    ></v-skeleton-loader>
    <v-card v-else>
      <v-card-title class="bg-primary mb-5">
        User
      </v-card-title>
      <v-card-text>
        <v-alert v-if="state.alert.show" :type="state.alert.type">{{ state.alert.message }}</v-alert>
        <v-form ref="form">
          <v-row no-gutters>
            <v-col cols="6">
              <v-text-field
                label="First name*"
                density="compact"
                v-model="state.user.first_name"
                placeholder="James"
                variant="outlined"
                :rules="[v => !!v || 'First name is required']"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="Last name*"
                density="compact"
                v-model="state.user.last_name"
                placeholder="Smith"
                variant="outlined"
                :rules="[v => !!v || 'Last name is required']"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="Email address*"
                density="compact"
                v-model="state.user.email"
                placeholder="james@smith.com"
                variant="outlined"
                :rules="[v => !!v || 'Email is required']"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="Organisation"
                density="compact"
                v-model="state.user.organisation"
                placeholder="The Organisation"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col  v-if="!props.userId" cols="12" >
              <v-text-field
                label="Password"
                density="compact"
                v-model="state.user.password"
                type="password"
                variant="outlined"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row v-if="state.groups" no-gutters>
            <v-col class="py-0 my-0" v-for="group in state.groups" :key="group.group_ref" cols="12">
              <v-checkbox
                :label="group.usergroup_name"
                v-model="group.checked"
                density="compact"
                class="py-0 my-0"
              ></v-checkbox>
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
