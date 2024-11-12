<script setup>
  import { ref, watch, inject } from 'vue'
  import { useRouter } from 'vue-router'

  const drawer = ref(false)
  const group = ref(null)
  const user = inject('user')
  const userSignout = inject('signout')

  const router = useRouter()

  watch(group, () => {
    drawer.value = false
  })

  function signout() {
    userSignout()
    router.push({ name: 'Home' })
  }

  function signin() {
    router.push({ name: 'Signin' })
  }
</script>

<template>
  <v-app-bar color="primary" :elevation="2">
    <template v-slot:prepend>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
    </template>
    <v-app-bar-title><router-link :to="{name:'Home'}" style="text-decoration: none; color: inherit;">Ulendo</router-link></v-app-bar-title>
    <v-spacer></v-spacer>
    <v-menu bottom left>
      <template v-slot:activator="{ props }">
        <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
      </template>
      <v-card v-if="user.user_id" >
        <v-card-title>
          <v-avatar>
            <v-icon>mdi-account</v-icon>
          </v-avatar> {{ user.first_name }} {{ user.last_name }}
        </v-card-title>
        <v-card-subtitle>{{ user.email }}<template v-if="user.organisation"> - {{ user.organisation }}</template></v-card-subtitle>
        <v-card-text>
          <v-btn prepend-icon="mdi-logout" block variant="text" @click="signout">Logout</v-btn>
        </v-card-text>
      </v-card>
      <v-card v-else>
        <v-card-text>
          <v-btn prepend-icon="mdi-login" block variant="text" @click="signin">Login</v-btn>
        </v-card-text>
      </v-card>
    </v-menu>
  </v-app-bar>
  <v-navigation-drawer temporary v-model="drawer">
    <v-list density="compact" nav>
      <v-list-item prepend-icon="mdi-view-dashboard" to="/">Home</v-list-item>
      <v-list-item v-if="user.isAdmin" prepend-icon="mdi-account" :to="{name: 'Users'}">Users</v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
