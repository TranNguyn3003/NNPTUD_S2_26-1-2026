async function GetData() {
    try {
        let res = await fetch('http://localhost:3000/posts')
        if (res.ok) {
            let posts = await res.json();
            let bodyTable = document.getElementById('body-table');
            bodyTable.innerHTML = '';
            for (const post of posts) {
                bodyTable.innerHTML += convertObjToHTML(post)
            }
        }
    } catch (error) {
        console.log(error);
    }
}

async function GetComments() {
    try {
        let res = await fetch('http://localhost:3000/comments')
        if (res.ok) {
            let comments = await res.json();
            let bodyTable = document.getElementById('body-comments-table');
            if (bodyTable) {
                bodyTable.innerHTML = '';
                for (const comment of comments) {
                    bodyTable.innerHTML += convertCommentToHTML(comment)
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function Save() {
    let id = document.getElementById("id_txt").value;
    let title = document.getElementById("title_txt").value;
    let views = document.getElementById("views_txt").value;

    if (id) {
        // Update existing post
        let getItem = await fetch('http://localhost:3000/posts/' + id);
        if (getItem.ok) {
            let existingPost = await getItem.json();
            let res = await fetch('http://localhost:3000/posts/'+id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: id,
                    title: title,
                    views: views,
                    isDeleted: existingPost.isDeleted || false
                })
            })
        }
    } else {
        // Create new post - auto-increment ID
        let res = await fetch('http://localhost:3000/posts');
        let allPosts = await res.json();
        
        // Find max ID
        let maxId = 0;
        for (const post of allPosts) {
            let postId = parseInt(post.id) || 0;
            if (postId > maxId) {
                maxId = postId;
            }
        }
        
        // New ID = maxId + 1 (as string)
        let newId = String(maxId + 1);
        
        let createRes = await fetch('http://localhost:3000/posts', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: newId,
                title: title,
                views: views,
                isDeleted: false
            })
        })
    }
    GetData();
    return false;
}

function convertObjToHTML(post) {
    let isDeleted = post.isDeleted || false;
    let style = isDeleted ? 'style="text-decoration: line-through; opacity: 0.6;"' : '';
    return `<tr ${style}>
    <td>${post.id}</td>
    <td>${post.title}</td>
    <td>${post.views}</td>
    <td><input type='submit' value='Delete' onclick='Delete("${post.id}")'></td>
    </tr>`
}
async function Delete(id) {
    // Soft delete - set isDeleted to true
    let getItem = await fetch('http://localhost:3000/posts/' + id);
    if (getItem.ok) {
        let post = await getItem.json();
        let res = await fetch('http://localhost:3000/posts/' + id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...post,
                isDeleted: true
            })
        })
        if (res.ok) {
            GetData()
        }
    }
    return false;
}

// Comments CRUD functions
async function SaveComment() {
    let id = document.getElementById("comment_id_txt").value;
    let text = document.getElementById("comment_text_txt").value;
    let postId = document.getElementById("comment_postId_txt").value;

    if (id) {
        // Update existing comment
        let getItem = await fetch('http://localhost:3000/comments/' + id);
        if (getItem.ok) {
            let existingComment = await getItem.json();
            let res = await fetch('http://localhost:3000/comments/'+id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: id,
                    text: text,
                    postId: postId,
                    isDeleted: existingComment.isDeleted || false
                })
            })
        }
    } else {
        // Create new comment - auto-increment ID
        let res = await fetch('http://localhost:3000/comments');
        let allComments = await res.json();
        
        // Find max ID
        let maxId = 0;
        for (const comment of allComments) {
            let commentId = parseInt(comment.id) || 0;
            if (commentId > maxId) {
                maxId = commentId;
            }
        }
        
        // New ID = maxId + 1 (as string)
        let newId = String(maxId + 1);
        
        let createRes = await fetch('http://localhost:3000/comments', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: newId,
                text: text,
                postId: postId,
                isDeleted: false
            })
        })
    }
    GetComments();
    return false;
}

function convertCommentToHTML(comment) {
    let isDeleted = comment.isDeleted || false;
    let style = isDeleted ? 'style="text-decoration: line-through; opacity: 0.6;"' : '';
    return `<tr ${style}>
    <td>${comment.id}</td>
    <td>${comment.text}</td>
    <td>${comment.postId}</td>
    <td><input type='submit' value='Delete' onclick='DeleteComment("${comment.id}")'></td>
    </tr>`
}

async function DeleteComment(id) {
    // Soft delete - set isDeleted to true
    let getItem = await fetch('http://localhost:3000/comments/' + id);
    if (getItem.ok) {
        let comment = await getItem.json();
        let res = await fetch('http://localhost:3000/comments/' + id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...comment,
                isDeleted: true
            })
        })
        if (res.ok) {
            GetComments()
        }
    }
    return false;
}

GetData();
GetComments();