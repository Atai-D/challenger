package com.challengerewards.repo;

import com.challengerewards.domain.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepo extends JpaRepository<AppUser, String> {}
