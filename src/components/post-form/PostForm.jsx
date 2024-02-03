import  { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, RTE, Select } from "..";
import appwriteService from "../../appwrite/config";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PostForm({ post }) {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, control, getValues } = useForm({
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      content: post?.content || "",
      status: post?.status || "active",
    },
  });

  const userData = useSelector((state) => state.auth.userData);

  const submit = async (data) => {
    try {
      // Check if userData is defined and has $id property
      if (!userData || !userData.$id) {
        console.error("User data is not loaded or user is not logged in");
        return;
      }
  
      let fileId;
  
      // Check if featured image is provided in the data
      if (data.featuredimage && data.featuredimage[0]) {
        // Upload the first file from the FileList
        const file = await appwriteService.uploadFile(data.featuredimage[0]);
        if (file) {
          fileId = file.$id;
        }
      }
  
      // Check if post exists (update operation) or it's a new post (create operation)
      if (post) {
        // If fileId is available, delete the previous featured image
        if (fileId) {
          const featuredImageToDelete = post.featuredimage && post.featuredimage.$id;
          if (featuredImageToDelete) {
            await appwriteService.deleteFile(featuredImageToDelete);
          }
        }
  
        // Update the existing post
        const dbPost = await appwriteService.updatePost(post.$id, {
          ...data,
          featuredimage: fileId || undefined,
        });
  
        // Navigate to the updated post
        if (dbPost) {
          navigate(`/post/${dbPost.$id}`);
        }
      } else {
        // If fileId is available, set it in the data
        if (fileId) {
          data.featuredimage = fileId;
        }
  
        // Check if userData is available and has $id property
        if (userData && userData.$id) {
          // Create a new post
          const dbPost = await appwriteService.createPost({ ...data, userId: userData.$id });
  
          // Navigate to the newly created post
          if (dbPost) {
            navigate(`/post/${dbPost.$id}`);
          }
        } else {
          console.error("userData is undefined or does not have an $id property");
        }
      }
    } catch (error) {
      console.error("Error in submit:", error);
    }
  };
  
  

  const slugTransform = useCallback((value) => {
    if (value && typeof value === "string") {
      return value.trim().toLowerCase().replace(/[^a-zA-Z\d\s]+/g, "-").replace(/\s/g, "-");
    }
    return "";
  }, []);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "title") {
        setValue("slug", slugTransform(value.title), { shouldValidate: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, slugTransform, setValue]);

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
      <div className="w-2/3 px-2">
        <Input label="Title :" placeholder="Title" className="mb-4" {...register("title", { required: true })} />
        <Input label="Slug :" placeholder="Slug" className="mb-4" {...register("slug", { required: true })} onInput={(e) => {
          setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true });
        }} />
        <RTE label="Content :" name="content" control={control} defaultValue={getValues("content")} />
      </div>
      <div className="w-1/3 px-2">
        <Input
          label="Featured Image :"
          type="file"
          className="mb-4"
          accept="image/png, image/jpg, image/jpeg, image/gif"
          {...register("featuredimage", { required: !post })}
        />
        {post && (
          <div className="w-full mb-4">
            <img src={appwriteService.getFilePreview(post.featuredimage)} alt={post.title} className="rounded-lg" />
          </div>
        )}
        <Select options={["active", "inactive"]} label="Status" className="mb-4" {...register("status", { required: true })} />
        <Button type="submit" bgColor={post ? "bg-green-500" : undefined} className="w-full">
          {post ? "Update" : "Submit"}
        </Button>
      </div>
    </form>
  );
}
