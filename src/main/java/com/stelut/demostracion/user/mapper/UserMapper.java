package com.stelut.demostracion.user.mapper;

import com.stelut.demostracion.auth.dto.UserResponse;
import com.stelut.demostracion.user.User;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

	@Mapping(target = "role", expression = "java(user.getRole().name())")
	UserResponse toUserResponse(User user);
}
