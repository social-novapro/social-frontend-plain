<script>
    import { goto } from '$app/navigation';

    function sendLoginRequest() {

    }
    function forgetPage() {
        goto('/flow/forget');
    }
    function flowPage() {
        goto("/flow/")
    }
</script>
<div class="menu menu-style">
    <h1>Please Login!</h1>
    <form on:submit={sendLoginRequest} id="signInForm">
        <div class="menu menu-style">
            <p>Enter Username or Email:</p>
            <p><input class="contentMessage userEditForm menu-style" id="userUsernameLogin" placeholder="Username/Email" type="username" name="username"></p>
        </div>
        <div class="menu menu-style">
            <p>Enter Password</p>
            <p><input class="contentMessage userEditForm menu-style" id="userPasswordLogin" placeholder="Password" type="password" name="password"></p>
        </div>
        <div>
            <button class="menuButton menuButton-style" type="submit">Login</button>
        </div>
    </form>
    <div>
        <button class="menuButton menuButton-style" on:click={forgetPage}>Forgot Password</button>
    </div>
    <div>
        <button class="menuButton menuButton-style" on:click={flowPage}>Back to Begin Page</button>
    </div>
</div>
