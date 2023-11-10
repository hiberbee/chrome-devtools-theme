<script>
  import { app } from '~store/store.ts';

  import { styleBuilder } from '~utils/styleBuilder';
  import { debounce } from '@github/mini-throttle';

  function applyTheme() {
    styleBuilder.applyTheme(
      {
        currentTheme: $app.currentTheme,
        currentFontFamily: $app.currentFontFamily,
        currentFontSize: $app.currentFontSize,
        currentAccentColor: $app.currentAccentColor,
        scrollbars: $app.scrollbars
      });
  }

  const debouncedApply = debounce(applyTheme, 300);

  function resetAccent() {
    $app.resetAccent();
    applyTheme();
  }
</script>

<style lang='scss'>
  .font-setting {
    display: block;
    margin: 1rem auto;

    label {
      display: block;
      text-align: left;
      margin-bottom: 0.5em;
    }

    input {
      display: block;
      background-image: none;
    }

    .accent-color-input {
      border: none;
      display: inline-block;
    }
  }

  .font-family input {
    font-size: 0.875rem;
  }

  .color-preview {
    padding: 3px;
    color: white;
    border-radius: 10px;
  }

  .accent-reset-button {
    background: var(--button);
    color: var(--text);
    border-radius: 0;
    padding: .5em;
    text-transform: uppercase;
    border: 0;
    transition: all .3s;
    outline: none;

    &:hover {
      background: var(--hl);
      color: var(--selection-fg-color);
    }
  }

  .accent-color-wrapper {
    display: flex;
    justify-content: space-between;
  }

  input[type='color'] {
    -webkit-appearance: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  input[type='color']::-webkit-color-swatch-wrapper {
    padding: 0;
    border-radius: 50%;
  }

  input[type='color']::-webkit-color-swatch {
    border-color: var(--border);
    border-radius: 50%;
  }

  input[type='checkbox'] {
    filter: none !important;
    position: absolute !important;
    opacity: 0 !important;
  }

  input[type='checkbox'] + label {
    position: relative !important;
    cursor: pointer !important;
    padding: 0 !important;
  }

  input[type='checkbox'] + label:before {
    position: relative;
    content: '' !important;
    margin-right: 10px !important;
    display: inline-block !important;
    vertical-align: text-top !important;
    width: 16px !important;
    height: 16px !important;
    background: var(--bg) !important;
    border: 2px solid var(--accent) !important;
    border-radius: 4px !important;
  }

  input[type='checkbox']:hover + label:before {
    background: var(--contrast) !important;
  }

  input[type='checkbox']:focus + label:before {
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.12) !important;
  }

  input[type='checkbox']:checked + label:before {
    background: var(--accent) !important;
    color: var(--bg) !important;
  }

  input[type='checkbox']:disabled + label {
    color: #b8b8b8 !important;
    cursor: auto !important;
  }

  input[type='checkbox']:disabled + label:before {
    box-shadow: none !important;
    opacity: 0.6;
  }

  input[type='checkbox']:checked + label:after {
    content: '' !important;
    position: absolute !important;
    left: 3px !important;
    top: 38% !important;
    background: var(--bg) !important;
    width: 2px !important;
    height: 2px !important;
    box-shadow: 2px 0 0 var(--bg), 4px 0 0 var(--bg), 4px -2px 0 var(--bg), 4px -4px 0 var(--bg),
    4px -6px 0 var(--bg), 4px -8px 0 var(--bg) !important;
    transform: rotate(45deg) !important;
  }

</style>

<div class='font-setting font-family'>
  <label for='font-family-input'>Font Family:
    <span style="font-family: '{$app.currentFontFamily}'">{$app.currentFontFamily}</span>
  </label>

  <input id='font-family-input'
         type='text'
         on:change='{debouncedApply}'
         bind:value='{$app.currentFontFamily}'
         placeholder='e.g. Menlo' />
</div>

<div class='font-setting font-size'>
  <label for='font-size-input'>Font size:
    <output id='font-size-output' for='font-size-input'>{$app.currentFontSize}</output>
    px
  </label>

  <input id='font-size-input' type='range'
         min='10'
         max='22'
         on:change='{debouncedApply}'
         bind:value='{$app.currentFontSize}' />
</div>

<div class='font-setting accent-color'>
  <label for='color'>Accent Color:
    <mark class='color-preview' style='background-color: {$app.currentAccentColor || $app.currentTheme?.accent}'>
      {$app.currentAccentColor || 'Default'}
    </mark>
  </label>

  <div class='accent-color-wrapper'>
    {#if $app.currentAccentColor == null}
      <input type='color'
             id='color'
             class='accent-color-input'
             on:change={debouncedApply}
             bind:value={$app.currentAccentColor} />
    {:else}
      <input type='color'
             id='color'
             class='accent-color-input'
             on:change={debouncedApply}
             bind:value={$app.currentAccentColor} />
    {/if}
    <button class='accent-reset-button' on:click={resetAccent}>Reset to default</button>
  </div>
</div>

<div class='setting scrollbars'>
  <label for=''>Accent Scrollbars:</label>
  <input type='checkbox'
         id='scrollbars'
         on:change={debouncedApply}
         bind:checked={$app.scrollbars} />
  <label for='scrollbars'></label>
</div>
