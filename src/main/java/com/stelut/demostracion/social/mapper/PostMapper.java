package com.stelut.demostracion.social.mapper;

import com.stelut.demostracion.social.Post;
import com.stelut.demostracion.social.dto.PostResponse;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PostMapper {

	@Mapping(target = "id", source = "post.id")
	@Mapping(target = "authorId", source = "post.author.id")
	@Mapping(target = "authorDisplayName", source = "post.authorDisplayName")
	@Mapping(target = "content", source = "post.content")
	@Mapping(target = "createdAt", source = "post.createdAt")
	@Mapping(target = "updatedAt", source = "post.updatedAt")
	@Mapping(target = "likes", source = "likes")
	@Mapping(target = "views", source = "views")
	@Mapping(target = "comments", source = "comments")
	@Mapping(target = "likedByMe", source = "likedByMe")
	PostResponse toPostResponse(Post post, long likes, long views, long comments, boolean likedByMe);
}
