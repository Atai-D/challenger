package com.challengerewards.repo;

import com.challengerewards.domain.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrgRepo extends JpaRepository<Organization, String> {}
