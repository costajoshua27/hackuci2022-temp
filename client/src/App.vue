<template>
  <div id="app">
    <!-- <nav class="navbar navbar-expand-lg navbar-light">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">
          <img id="logo" src="@/assets/dark_logo.png">
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link active" aria-current="page" href="#">Home</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>     -->
    <router-view/>
  </div>
</template>

<style>
  html, body {
    margin: 0;
    padding: 0;
  }

  #app {
    height: 100vh;
    width: 100vw;
    /* background-color: #F7F7F9; */
    background-color: none;
  }

  svg {
    height: 4.0em;
    width: 4.0em;
    display: block;
    margin: auto;
    color: #41E2BA
  } 
</style>
