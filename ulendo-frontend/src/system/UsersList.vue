<script setup>
  import { inject } from 'vue'
  import { reactive } from 'vue'
  import UserForm from '@/system/UserForm.vue'
  import PasswordForm from '@/system/PasswordForm.vue'

  const axiosPlain = inject('axiosSecure')

  const state = reactive({
    users: []
  })

  const alerts = reactive({
    visible:false,
    type:null,
    title: null,
    text: null
  })

  function alert(type, title, text) {
    alerts.type = type
    alerts.title = title
    alerts.text = text
    alerts.visible = true
    setTimeout(function(){
      alerts.visible = false
    }, 3000)
  }

  axiosPlain.get('/users')
    .then(rows => {
      state.users = rows.data
    })
    .catch(err => {alert('error', 'Error', JSON.stringify(err.message))})

  function userCreated(user) {
    state.users.push(user)
  }

  function userUpdated(user) {
    state.users[state.users.map(v=>v.user_id).indexOf(user.user_id)] = user
  }

  function deleteUser(user) {
    axiosPlain.delete(`/user/${user.user_id}`)
      .then(() => {
        state.users.splice(state.users.map(v=>v.user_id).indexOf(user.user_id), 1)
      })
      .catch(err => {alert('error', 'Error', JSON.stringify(err.message))})
  }

  const userTableHeaders = [
    {title: 'Name', align: 'start', sortable: true, key: 'user_name'},
    {title: 'Email', align: 'start', sortable: true, key: 'email'},
    {title: 'Organisation', align: 'start', sortable: true, key: 'organisation'},
    {title: 'Actions', align: 'middle', sortable: false, key: 'actions'},
  ]

</script>

<template>

<v-container fluid>
    <v-alert
      :type="alerts.type"
      :title="alerts.title"
      :text="alerts.text"
      v-if="alerts.visible"
    ></v-alert>
    <v-row>
      <v-col class="" cols="12">
        <UserForm @user-created="userCreated">
          <template #activator="{ activate }">
            <v-btn color="primary" @click="activate">Add User</v-btn>
          </template>
        </UserForm>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="" cols="12">
        <v-card v-if="state.users" class="mx-auto">
          <v-data-table
            :sort-by="[{key:'email'}]"
            :headers="userTableHeaders"
            :items="state.users"
            item-value="email"
            items-per-page="-1"
            class="elevation-1"
            density="compact"
          >
            <template v-slot:item.actions="{ item }">
              <UserForm :user-id="item.user_id" @user-created="userCreated" @user-updated="userUpdated">
                <template #activator="{ activate }">
                  <v-btn title="Edit" size="x-small" variant="flat" @click="activate" icon="mdi-pencil"></v-btn>
                </template>
              </UserForm>
              <PasswordForm :user-id="item.user_id">
                <template #activator="{ activate }">
                  <v-btn size="x-small" variant="flat" @click="activate" icon="mdi-key"></v-btn>
                </template>
              </PasswordForm>

              <v-btn v-if="item.pageview_count == 0" size="x-small" variant="flat" @click="deleteUser(item)" icon="mdi-delete"></v-btn>
            </template>
            <template #bottom></template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
