<template>
  <div>
    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/" class="nav-brand">🎙️ Audio Annotation</router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/upload" class="nav-link">Upload</router-link>
          <router-link to="/queue" class="nav-link">Queue</router-link>
        </div>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
// App root component with router view
</script>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

.navbar {
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0;
  margin: 0;
  border-bottom: 1px solid #e0e0e0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: #666;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #007bff;
}

.nav-link.router-link-active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.25rem;
}
</style>
