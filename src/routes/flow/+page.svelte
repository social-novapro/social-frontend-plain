<script>
    import { goto } from "$app/navigation";

    function loginPage() {
        goto("/flow/login");
    }

    function createUserPage() {
        goto("/flow/create");
    }
</script>

<div class="menu menu-style">
    <h1>You're not signed in</h1>
    <p>Please sign into Interact to Proceed!</p>
    <div>
        <button class="menuButton menuButton-style" on:click={loginPage}>Log into Your Account</button>
    </div>
    <div>
        <button class="menuButton menuButton-style" on:click={createUserPage}>Create an Account</button>
    </div>
</div>