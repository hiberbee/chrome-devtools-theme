<style lang='scss'>
  .loading {
    background: var(--bg, #263238);
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    width: 100%;
    height: 100%;
    margin: 0 auto;
    padding: 0 2rem;
    max-width: 40rem;
    min-width: 24rem;

    h4 {
      font-weight: normal;
      font-style: normal;
      color: var(--fg, #b0bec5);
      text-rendering: optimizeLegibility;
      margin-top: 0.2rem;
      margin-bottom: 0.5rem;
      line-height: 1.4;

      margin-top: 0;
      margin-bottom: 0;
      line-height: 1;
      font-size: 2em;
    }

    &:empty {
      display: none;
    }
  }

</style>

<script>
  import { app } from '~store/store.ts';
</script>

<div class='loading'>
  {#if $app.loading}
    <h4>Loading...</h4>
  {/if}
</div>
