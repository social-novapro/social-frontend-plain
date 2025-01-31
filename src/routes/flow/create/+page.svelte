<script lang="ts">
    import { goto } from '$app/navigation';

    function sendLoginRequest() {

    }
    function forgetPage() {
        goto('/flow/forget');
    }
    function flowPage() {
        goto("/flow/")
    }
    function createNewUserRequest(event: Event) {
        event.preventDefault();
        const formData = new FormData(event.target as HTMLFormElement);
        const user = {
            email: formData.get('emailCreate'),
            username: formData.get('usernameCreate'),
            displayname: formData.get('displaynameCreate'),
            password: formData.get('passwordCreate'),
            description: formData.get('descriptionCreate'),
            pronouns: formData.get('pronounsCreate'),
            birthDate: formData.get('birthDateCreate')
        };
        console.log(user);
        // Add your logic to handle the user creation request here
    }
</script>
<div class="menu menu-style">
    <h1>Please Create an Account!</h1>
    <form on:submit={createNewUserRequest} id="createUserForm">
        <div class="menu menu-style">
            <p>Enter Your Email:</p>
            <input type="text" class="contentMessage userEditForm menu-style" name="emailCreate" placeholder="Email">
        </div>
        <div class="menu menu-style">
            <p>Enter Your New Username: (required)</p>
            <input type="text" class="contentMessage userEditForm menu-style" name="usernameCreate" placeholder="Username">
        </div>
        <div class="menu menu-style">
            <p>Enter Your New Displayname: (required)</p>
            <input type="text" class="contentMessage userEditForm menu-style" name="displaynameCreate" placeholder="Displayname">
        </div>
        <div class="menu menu-style">
            <p>Enter Your New Password: (required)</p>
            <input type="password" class="contentMessage userEditForm menu-style" name="passwordCreate" placeholder="Password">
        </div>
        <div class="menu menu-style">
            <p>Enter Your Description:</p>
            <input type="text" class="contentMessage userEditForm menu-style" name="descriptionCreate" placeholder="Description">
        </div>
        <div class="menu menu-style">
            <p>Enter Your Pronouns:</p>
            <input type="text" class="contentMessage userEditForm menu-style" name="pronounsCreate" placeholder="Pronouns">
        </div>
        <div class="menu menu-style">
            <p>Enter Your Birthdate: (required)</p>
            <input type="date" class="contentMessage userEditForm menu-style" name="birthDateCreate" placeholder="01/01/04">
        </div>
        <div class="menu menu-style">
            <button class="buttonStyled" type="submit">Create Account</button>
        </div>
    </form>
    <div>
        <button class="menuButton menuButton-style" on:click={flowPage}>Back to Begin Page</button>
    </div>
</div>
