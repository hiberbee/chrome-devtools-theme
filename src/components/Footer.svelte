<style lang='scss'>
  .footer {
    grid-area: footer;
    text-align: right;

    a {
      text-decoration: none;
      color: var(--links);
    }
  }
</style>

<script>
  const year = new Date().getFullYear();
</script>

<div class='footer'>
  <small>Material Theme © 2015-{year} <a target='_blank' href='https://www.material-theme.com'>Elior Boukhobza & Jonas Augsburger</a></small>
  -
  <small>Original concept from <a target='_blank' href='https://github.com/micjamking'>Mike King</a></small>
</div>
