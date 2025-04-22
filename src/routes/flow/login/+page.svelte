<script lang="ts">
    let username = '';
    let password = '';

    import { goto } from '$app/navigation';

    function handleSubmit(event: Event) {
        event.preventDefault(); // prevent default form submit behavior

        // You now have access to bound values
        console.log('Submitting:', { username, password });

    }
    function forgetPage() {
        goto('/flow/forget');
    }
    function flowPage() {
        goto("/flow/")
    }

    function checklogin() {
        return false; 
    }
</script>

<div class="menu menu-style">
    <h1>Please Login!</h1>
    <form on:submit={handleSubmit}>
        <div class="menu menu-style">
            <p>Enter Username or Email:</p>
            <p><input class="contentMessage userEditForm menu-style" bind:value={username} placeholder="Username/Email" type="username" name="username"></p>
        </div>
        <div class="menu menu-style">
            <p>Enter Password</p>
            <p><input class="contentMessage userEditForm menu-style" bind:value={password} placeholder="Password" type="password" name="password"></p>
        </div>
        <div>
            <button class="menuButton menuButton-style" type="submit" on:submit={checklogin}>Login</button>
        </div>
    </form>
    <div>
        <button class="menuButton menuButton-style" on:click={forgetPage}>Forgot Password</button>
    </div>
    <div>
        <button class="menuButton menuButton-style" on:click={flowPage}>Back to Begin Page</button>
    </div>
</div>
