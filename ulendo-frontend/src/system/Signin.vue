<script setup>
  import { inject, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'

  const signin = inject('signin')
  const router = useRouter()
  const route = useRoute()

  const error = ref(null)
  const email = ref('')
  const password = ref('')

  const doSignin = () => {
    signin(email.value, password.value)
      .then(() => {
        //if there is a redirect path, go there
        if (route.query.to) {
          router.push(route.query.to)
        } else {
          router.push('/')
        }
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
            error.value = 'Incorrect email or password'
        } else {
          console.error(err)
          error.value = err
        }
      })
  }
</script>
<template>
     <v-main>
        <v-container class="fill-height" fluid>
          <v-row align="center" justify="center" >
            <v-col cols="12" sm="8" md="4">
              <v-card class="elevation-12 pb-1">
                <v-toolbar color="primary" dark flat>
                  <v-toolbar-title>Login</v-toolbar-title>
                </v-toolbar>
                <v-card-text>
                  <v-form>
                    <v-text-field
                      v-model="email"
                      label="Email"
                      placeholder=" "
                      persistent-placeholder
                      prepend-icon="mdi-account"
                      type="email"
                      required
                    ></v-text-field>
                    <v-text-field
                      v-model="password"
                      label="Password"
                      placeholder=" "
                      persistent-placeholder
                      prepend-icon="mdi-lock"
                      @keyup.enter="doSignin"
                      type="password"
                      required
                    ></v-text-field>
                  </v-form>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="doSignin">Login</v-btn>
                </v-card-actions>
                <v-alert class="ml-5 mr-5" v-if="error" type="error">{{ error }}</v-alert>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
</template>

<script>
// import { required, email } from 'vuelidate/lib/validators'
/*
export default {
  name: 'Signin',
  data () {
    return {
      email: '',
      password: '',
      error: null
    }
  },
  validations: {
    email: {
      required,
      email
    },
    password: {
      required
    }
  },
  computed: {
    emailErrors () {
      const errors = []
      if (!this.$v.email.$dirty) return errors
      !this.$v.email.email && errors.push('Must be valid e-mail')
      !this.$v.email.required && errors.push('E-mail is required')
      return errors
    },
    passwordErrors () {
      const errors = []
      if (!this.$v.password.$dirty) return errors
      !this.$v.password.required && errors.push('Password is required')
      return errors
    }
  }
}
*/
</script>
