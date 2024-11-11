<script setup>
  import { ref, reactive, inject, watch } from 'vue'
  import { useRoute } from 'vue-router'
  
  const route = useRoute()

  const axiosPlain = inject('axiosSecure')
  
  const form = ref()

  const blankUser = {
    user_id: null,
    first_name: null,
    last_name: null,
    email: null,
    password: null
  }

  const state = reactive({  
    userId: null,  
    user: {...blankUser},
    alert: {
      show: false,
      message: null,
      type: null
    }

  })

  watch(
    () => route.params.user_id,
    userId => {
      state.userId = parseInt(userId)
      axiosPlain.get('/user/' + userId)
          .then(rows => {
            state.user = rows.data
          })
    }, { immediate: true }
  )

  
  async function submit () {

    const { valid } = await form.value.validate()

    if (valid) {
      if (state.userId) {
        axiosPlain.put(`/user/${state.userId}`, state.user)
        .catch(error => {
            state.alert.show = true
            state.alert.message = error.message
            state.alert.type = 'error'
          })
      } else {
        axiosPlain.post('/user', state.user)
          .then(response => {
            state.userId = response.data
            state.alert.show = true
            state.alert.message = 'User added.'
            state.alert.type = 'success'
            state.user = {...blankUser}     
          })
          .catch(error => {
            state.alert.show = true
            state.alert.message = error.message
            state.alert.type = 'error'
          })
      }
    }
  }

</script>

<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-alert v-if="state.alert.show" :type="state.alert.type">{{ state.alert.message }}</v-alert>
        <v-card>
          <v-card-title class="bg-primary mb-5">
            User
          </v-card-title>
          <v-card-text>
            <v-form
              ref="form"
            >        
              <v-row>
                <v-col
                  cols="6" 
                >
                  <v-text-field
                    label="First name*"
                    density="compact"
                    v-model="state.user.first_name"
                    placeholder="James"
                    variant="outlined"
                    :rules="[v => !!v || 'First name is required']"
                  ></v-text-field>
                </v-col>
                <v-col
                  cols="6" 
                >
                  <v-text-field
                    label="Last name*"
                    density="compact"
                    v-model="state.user.last_name"
                    placeholder="Smith"
                    variant="outlined"
                    :rules="[v => !!v || 'Last name is required']"
                  ></v-text-field>
                </v-col>
                <v-col
                  cols="12" 
                >
                  <v-text-field
                    label="Email address*"
                    density="compact"
                    v-model="state.user.email"
                    placeholder="james@smith.com"
                    variant="outlined"
                    :rules="[v => !!v || 'Email is required']"
                  ></v-text-field>
                </v-col>            
                <v-col
                  cols="12" 
                >
                  <v-text-field
                    label="Password*"
                    density="compact"
                    v-model="state.user.password"
                    type="password"
                    variant="outlined"
                    :rules="[v => !!v || 'Password is required']"
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
          </v-card-actions>
        </v-card>
        
      </v-col>
    </v-row>
  </v-container>  
</template>
